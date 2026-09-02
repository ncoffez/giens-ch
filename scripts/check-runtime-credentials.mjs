/**
 * Validates the SHAPE of the credentials a production build bakes in.
 *
 * A present-but-malformed key is worse than a missing one: the deploy goes
 * green and `useFirebaseAdmin.ts` then throws on `JSON.parse` at module load,
 * so every SSR request answers 500. The usual cause is a value pasted into
 * GitHub with surrounding quotes, or with the private key's newlines flattened.
 *
 * Never prints a value — only which check failed.
 */

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT || "giens-ch";

export function validateAdminKey(raw, expectedProjectId = EXPECTED_PROJECT_ID) {
	const problems = [];
	if (!raw) return ["FIREBASE_ADMIN_KEY is empty"];

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return ["FIREBASE_ADMIN_KEY is not valid JSON (pasted with surrounding quotes, or truncated?)"];
	}

	if (parsed.type !== "service_account") problems.push('FIREBASE_ADMIN_KEY has no "type": "service_account"');
	if (!parsed.client_email) problems.push("FIREBASE_ADMIN_KEY has no client_email");
	if (parsed.project_id !== expectedProjectId) {
		problems.push(`FIREBASE_ADMIN_KEY project_id is not ${expectedProjectId}`);
	}
	if (!parsed.private_key) {
		problems.push("FIREBASE_ADMIN_KEY has no private_key");
	} else {
		if (!parsed.private_key.includes("BEGIN PRIVATE KEY")) {
			problems.push("FIREBASE_ADMIN_KEY private_key is not a PEM block");
		}
		// After JSON.parse the escaped \n must have become real newlines; if they
		// did not, the Firebase Admin SDK fails to read the key at runtime.
		if (!parsed.private_key.includes("\n")) {
			problems.push("FIREBASE_ADMIN_KEY private_key has no line breaks (the \\n escapes did not survive)");
		}
	}

	return problems;
}

export function validateFrontendKey(raw, expectedProjectId = EXPECTED_PROJECT_ID) {
	if (!raw) return ["FIREBASE_FRONTEND_KEY is empty"];

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return ["FIREBASE_FRONTEND_KEY is not valid JSON (pasted with surrounding quotes, or truncated?)"];
	}

	const problems = [];
	if (!parsed.apiKey) problems.push("FIREBASE_FRONTEND_KEY has no apiKey");
	if (parsed.projectId !== expectedProjectId) {
		problems.push(`FIREBASE_FRONTEND_KEY projectId is not ${expectedProjectId}`);
	}

	return problems;
}

export function validateCredentials(env, expectedProjectId = EXPECTED_PROJECT_ID) {
	return [
		...validateAdminKey(env.FIREBASE_ADMIN_KEY, expectedProjectId),
		...validateFrontendKey(env.FIREBASE_FRONTEND_KEY, expectedProjectId),
	];
}

// Only run the check when executed directly, so the tests can import the
// validators without the process exiting.
if (process.argv[1] && process.argv[1].endsWith("check-runtime-credentials.mjs")) {
	const problems = validateCredentials(process.env);

	if (problems.length) {
		for (const problem of problems) {
			console.error(`::error::${problem}`);
		}
		console.error("[credentials] Paste each value as a single line, unquoted, exactly as it appears in .env.");
		process.exit(1);
	}

	console.log("[credentials] Firebase admin and frontend keys have the expected shape.");
}
