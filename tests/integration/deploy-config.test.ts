import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
	EXPECTED_DEPLOY_ONLY,
	EXPECTED_STORAGE_BUCKET,
	REQUIRED_DEPLOY_ROLES,
	validateCiDeploy,
	validateDeployConfig,
	validateFirebaseJson,
	validateRulesFiles,
} from "../../scripts/check-deploy-config.mjs";

function loadRepoConfig() {
	return {
		firebaseConfig: JSON.parse(readFileSync("firebase.json", "utf8")),
		firestoreRules: readFileSync("firestore.rules", "utf8"),
		storageRules: readFileSync("storage.rules", "utf8"),
		workflowSource: readFileSync(".github/workflows/ci.yml", "utf8"),
		packageJson: JSON.parse(readFileSync("package.json", "utf8")),
	};
}

describe("deploy config contract", () => {
	it("accepts the repository files", () => {
		expect(validateDeployConfig(loadRepoConfig())).toEqual([]);
	});

	it("requires an explicit Storage bucket so CI never calls defaultBucket.get", () => {
		const problems = validateFirebaseJson({
			firestore: { rules: "firestore.rules", indexes: "firestore.indexes.json" },
			storage: { rules: "storage.rules" },
		});

		expect(problems.join(" ")).toContain("explicit bucket");
	});

	it("rejects a Storage bucket for the wrong project", () => {
		const problems = validateFirebaseJson({
			firestore: { rules: "firestore.rules", indexes: "firestore.indexes.json" },
			storage: [{ bucket: "other.appspot.com", rules: "storage.rules" }],
		});

		expect(problems.join(" ")).toContain(EXPECTED_STORAGE_BUCKET);
	});

	it("rejects open Firestore client access", () => {
		const problems = validateRulesFiles(
			"service cloud.firestore { match /{document=**} { allow read, write: if true; } }",
			readFileSync("storage.rules", "utf8"),
		);

		expect(problems.join(" ")).toContain("open client access");
	});

	it("keeps CI --only aligned with npm run deploy", () => {
		const { packageJson } = loadRepoConfig();
		const problems = validateCiDeploy(
			"run: firebase deploy --only functions,hosting",
			packageJson,
		);

		expect(problems.join(" ")).toContain("missing firestore");
		expect(problems.join(" ")).toContain("missing storage");
	});

	it("rejects a combined rules+functions deploy that hides permission 403s", () => {
		const { packageJson } = loadRepoConfig();
		const problems = validateCiDeploy(
			[
				"run: node scripts/check-deploy-config.mjs",
				"run: node scripts/check-deploy-permissions.mjs",
				"run: firebase deploy --only firestore,functions,hosting,storage",
			].join("\n"),
			packageJson,
		);

		expect(problems.join(" ")).toContain("combined --only");
	});

	it("rejects deploying functions before rules", () => {
		const { packageJson } = loadRepoConfig();
		const problems = validateCiDeploy(
			[
				"run: node scripts/check-deploy-config.mjs",
				"run: node scripts/check-deploy-permissions.mjs",
				"run: firebase deploy --only functions,hosting",
				"run: firebase deploy --only firestore,storage",
			].join("\n"),
			packageJson,
		);

		expect(problems.join(" ")).toContain("functions before firestore/storage");
	});

	it("documents the IAM roles github-deploy needs", () => {
		expect(REQUIRED_DEPLOY_ROLES).toEqual(expect.arrayContaining([
			"roles/firebaserules.admin",
			"roles/firebasestorage.admin",
			"roles/firebasehosting.admin",
		]));
	});
});

