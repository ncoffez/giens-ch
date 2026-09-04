/**
 * Static contract for production deploys.
 *
 * Catches the two CI failure modes we hit: shipping Storage/Rules without
 * pinning the bucket (v1alpha defaultBucket.get 403) and letting
 * firebase.json drift from the workflow --only list.
 *
 * Never talks to GCP. IAM still has to match; this only locks the files.
 */

import { readFileSync, existsSync } from "node:fs";

export const EXPECTED_PROJECT_ID = "giens-ch";
export const EXPECTED_STORAGE_BUCKET = `${EXPECTED_PROJECT_ID}.appspot.com`;
export const EXPECTED_DEPLOY_ONLY = "firestore,functions,hosting,storage";

export const REQUIRED_DEPLOY_ROLES = [
	"roles/firebasehosting.admin",
	"roles/cloudfunctions.developer",
	"roles/run.admin",
	"roles/datastore.indexAdmin",
	"roles/firebaserules.admin",
	"roles/firebasestorage.admin",
];

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function withoutComments(source) {
	return source.replace(/\/\/.*$/gm, "");
}

export function validateFirebaseJson(config, projectId = EXPECTED_PROJECT_ID) {
	const problems = [];
	const expectedBucket = `${projectId}.appspot.com`;

	if (!config.firestore?.indexes) {
		problems.push("firebase.json firestore.indexes is missing");
	}
	if (!config.firestore?.rules) {
		problems.push("firebase.json firestore.rules is missing");
	} else if (!existsSync(config.firestore.rules)) {
		problems.push(`firestore rules file ${config.firestore.rules} does not exist`);
	}

	if (!Array.isArray(config.storage) || config.storage.length === 0) {
		problems.push("firebase.json storage must be an array with an explicit bucket (avoids defaultBucket.get 403 in CI)");
	} else {
		const entry = config.storage[0];
		if (!entry?.bucket) {
			problems.push("firebase.json storage[0].bucket is missing");
		} else if (entry.bucket !== expectedBucket) {
			problems.push(`firebase.json storage[0].bucket is ${entry.bucket}, expected ${expectedBucket}`);
		}
		if (!entry?.rules) {
			problems.push("firebase.json storage[0].rules is missing");
		} else if (!existsSync(entry.rules)) {
			problems.push(`storage rules file ${entry.rules} does not exist`);
		}
	}

	return problems;
}

export function validateRulesFiles(firestoreRules, storageRules) {
	const problems = [];
	const firestoreBody = withoutComments(firestoreRules);
	if (!/allow read, write:\s*if false/.test(firestoreBody)) {
		problems.push("firestore.rules must deny default client access");
	}
	if (/allow read, write:\s*if true/.test(firestoreBody)) {
		problems.push("firestore.rules must not allow open client access");
	}

	const storageBody = withoutComments(storageRules);
	if (!/allow read, write:\s*if false/.test(storageBody)) {
		problems.push("storage.rules must deny default object access");
	}

	return problems;
}

export function parseDeployOnlyProducts(source) {
	const products = new Set();
	for (const match of source.matchAll(/--only\s+([^\s\\]+)/g)) {
		for (const part of match[1].split(",")) {
			const product = part.split(":")[0];
			if (product) products.add(product);
		}
	}
	return products;
}

export function validateSplitDeploy(workflowSource) {
	const problems = [];
	const onlyLists = [...workflowSource.matchAll(/--only\s+([^\s\\]+)/g)].map((match) => match[1]);

	const combined = onlyLists.find((list) => {
		const parts = list.split(",");
		const hasRules = parts.includes("firestore") || parts.includes("storage");
		const hasRuntime = parts.includes("functions") || parts.includes("hosting");
		return hasRules && hasRuntime;
	});
	if (combined) {
		problems.push(`CI must deploy rules before functions; found combined --only ${combined}`);
	}

	const rulesIndex = onlyLists.findIndex((list) => {
		const parts = list.split(",");
		return parts.includes("firestore") || parts.includes("storage");
	});
	const functionsIndex = onlyLists.findIndex((list) => list.split(",").includes("functions"));
	if (rulesIndex === -1) {
		problems.push("CI has no firestore/storage deploy step");
	}
	if (functionsIndex !== -1 && rulesIndex !== -1 && functionsIndex < rulesIndex) {
		problems.push("CI deploys functions before firestore/storage");
	}

	return problems;
}

export function validateCiDeploy(workflowSource, packageJson, expectedOnly = EXPECTED_DEPLOY_ONLY) {
	const problems = [];
	const needed = expectedOnly.split(",");
	const workflowProducts = parseDeployOnlyProducts(workflowSource);

	if (workflowProducts.size === 0) {
		problems.push("ci.yml has no firebase deploy --only list");
	} else {
		for (const product of needed) {
			if (!workflowProducts.has(product)) {
				problems.push(`ci.yml deploy --only is missing ${product}`);
			}
		}
	}

	if (/Strip security-rules keys/.test(workflowSource) || /delete config\.firestore\.rules/.test(workflowSource)) {
		problems.push("ci.yml must not strip rules keys from firebase.json");
	}

	if (!workflowSource.includes("check-deploy-config.mjs")) {
		problems.push("ci.yml must run check-deploy-config.mjs");
	}
	if (!workflowSource.includes("check-deploy-permissions.mjs")) {
		problems.push("ci.yml must run check-deploy-permissions.mjs after Google auth");
	}

	const deployScript = packageJson.scripts?.deploy || "";
	const scriptOnly = deployScript.match(/--only\s+([^\s"]+)/);
	if (!scriptOnly) {
		problems.push("package.json deploy script has no --only list");
	} else if (scriptOnly[1] !== expectedOnly) {
		problems.push(`package.json deploy --only is ${scriptOnly[1]}, expected ${expectedOnly}`);
	}

	problems.push(...validateSplitDeploy(workflowSource));

	return problems;
}

export function validateDeployConfig({
	firebaseConfig,
	firestoreRules,
	storageRules,
	workflowSource,
	packageJson,
	projectId = EXPECTED_PROJECT_ID,
} = {}) {
	return [
		...validateFirebaseJson(firebaseConfig, projectId),
		...validateRulesFiles(firestoreRules, storageRules),
		...validateCiDeploy(workflowSource, packageJson),
	];
}

if (process.argv[1] && process.argv[1].endsWith("check-deploy-config.mjs")) {
	const problems = validateDeployConfig({
		firebaseConfig: readJson("firebase.json"),
		firestoreRules: readFileSync("firestore.rules", "utf8"),
		storageRules: readFileSync("storage.rules", "utf8"),
		workflowSource: readFileSync(".github/workflows/ci.yml", "utf8"),
		packageJson: readJson("package.json"),
	});

	if (problems.length) {
		for (const problem of problems) {
			console.error(`::error::${problem}`);
		}
		process.exit(1);
	}

	console.log("Deploy config contract ok.");
	console.log(`Storage bucket pinned: ${EXPECTED_STORAGE_BUCKET}`);
	console.log(`CI --only: ${EXPECTED_DEPLOY_ONLY}`);
	console.log(`github-deploy roles: ${REQUIRED_DEPLOY_ROLES.join(", ")}`);
}
