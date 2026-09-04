/**
 * Live IAM probe for github-deploy.
 *
 * Static file checks cannot see a role being removed in GCP. firebase-tools
 * compiles Firestore and Storage rules via firebaserules :test. The v1alpha
 * bucket GET is the call that 403s even with firebasestorage.admin — we pin
 * the bucket in firebase.json so deploy never makes it, and this probe must
 * not make it either.
 *
 * Never prints the token.
 */

import {
	EXPECTED_PROJECT_ID,
	EXPECTED_STORAGE_BUCKET,
} from "./check-deploy-config.mjs";

const MINIMAL_FIRESTORE_RULES = [
	"rules_version = '2';",
	"service cloud.firestore {",
	"  match /databases/{database}/documents {",
	"    match /{document=**} { allow read, write: if false; }",
	"  }",
	"}",
].join("\n");

const MINIMAL_STORAGE_RULES = [
	"rules_version = '2';",
	"service firebase.storage {",
	"  match /b/{bucket}/o {",
	"    match /{allPaths=**} { allow read, write: if false; }",
	"  }",
	"}",
].join("\n");

function rulesTestProbe(id, fileName, content) {
	return {
		id,
		role: "roles/firebaserules.admin",
		method: "POST",
		url({ projectId }) {
			return `https://firebaserules.googleapis.com/v1/projects/${projectId}:test`;
		},
		body() {
			return JSON.stringify({
				source: {
					files: [{ name: fileName, content }],
				},
			});
		},
		ok(status) {
			// 400 still means the SA could call :test (payload shape), which is
			// the permission we care about. 401/403 are the deploy-killing cases.
			return status !== 401 && status !== 403 && status !== 0;
		},
	};
}

export const PERMISSION_PROBES = [
	rulesTestProbe("firestore-rules-test", "firestore.rules", MINIMAL_FIRESTORE_RULES),
	rulesTestProbe("storage-rules-test", "storage.rules", MINIMAL_STORAGE_RULES),
];

export function interpretProbe(probe, status) {
	if (probe.ok(status)) return null;
	if (status === 403) {
		return `github-deploy got 403 from ${probe.id}; grant ${probe.role} on the Firebase project`;
	}
	if (status === 401) {
		return `github-deploy is not authenticated for ${probe.id}`;
	}
	return `github-deploy got HTTP ${status} from ${probe.id} (need ${probe.role})`;
}

export async function resolveAccessToken({
	env = process.env,
	loadGoogleAuth = defaultLoadGoogleAuth,
} = {}) {
	const fromEnv = env.GOOGLE_ACCESS_TOKEN || env.CLOUDSDK_AUTH_ACCESS_TOKEN;
	if (fromEnv) return fromEnv;

	const GoogleAuth = await loadGoogleAuth();
	if (!GoogleAuth) return null;

	try {
		const auth = new GoogleAuth({
			scopes: ["https://www.googleapis.com/auth/cloud-platform"],
		});
		const client = await auth.getClient();
		const response = await client.getAccessToken();
		return response?.token || (typeof response === "string" ? response : null);
	} catch {
		return null;
	}
}

async function defaultLoadGoogleAuth() {
	try {
		const mod = await import("google-auth-library");
		return mod.GoogleAuth;
	} catch {
		return null;
	}
}

export async function probePermissions({
	token,
	projectId = EXPECTED_PROJECT_ID,
	bucket = EXPECTED_STORAGE_BUCKET,
	fetchImpl = fetch,
} = {}) {
	const problems = [];
	const results = [];
	const context = { projectId, bucket };

	for (const probe of PERMISSION_PROBES) {
		const url = probe.url(context);
		let status = 0;
		try {
			const headers = { Authorization: `Bearer ${token}` };
			const init = { method: probe.method, headers };
			if (probe.body) {
				headers["Content-Type"] = "application/json";
				init.body = probe.body(context);
			}
			const response = await fetchImpl(url, init);
			status = response.status;
		} catch (error) {
			problems.push(`${probe.id} request failed: ${error instanceof Error ? error.message : "network error"}`);
			results.push({ id: probe.id, status: 0, url });
			continue;
		}

		results.push({ id: probe.id, status, url });
		const problem = interpretProbe(probe, status);
		if (problem) problems.push(problem);
	}

	return { problems, results };
}

export function isCi(env = process.env) {
	return env.CI === "true" || env.CI === "1";
}

export async function runDeployPermissionCheck(deps = {}) {
	const env = deps.env || process.env;
	const token = await resolveAccessToken({
		env,
		loadGoogleAuth: deps.loadGoogleAuth,
	});

	if (!token) {
		if (isCi(env)) {
			return {
				skipped: false,
				problems: ["No Google access token. The GitHub Actions auth step must run first."],
			};
		}
		return { skipped: true, problems: [] };
	}

	return probePermissions({
		token,
		fetchImpl: deps.fetchImpl,
		projectId: deps.projectId,
		bucket: deps.bucket,
	}).then(({ problems, results }) => ({ skipped: false, problems, results }));
}

if (process.argv[1] && process.argv[1].endsWith("check-deploy-permissions.mjs")) {
	const { skipped, problems } = await runDeployPermissionCheck();

	if (skipped) {
		console.log("Skipping live IAM probe (no Google credentials).");
		process.exit(0);
	}

	if (problems.length) {
		for (const problem of problems) {
			console.error(`::error::${problem}`);
		}
		process.exit(1);
	}

	console.log("Deploy IAM probe ok.");
	console.log(`Rules compile API: firebaserules.googleapis.com projects/${EXPECTED_PROJECT_ID}:test`);
	console.log(`Pinned Storage bucket (not probed): ${EXPECTED_STORAGE_BUCKET}`);
}
