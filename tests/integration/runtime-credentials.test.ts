import { describe, expect, it } from "vitest";
import { validateAdminKey, validateCredentials, validateFrontendKey } from "../../scripts/check-runtime-credentials.mjs";

const PROJECT = "giens-ch";

function adminKey(overrides = {}) {
	return JSON.stringify({
		type: "service_account",
		project_id: PROJECT,
		client_email: "firebase-adminsdk@giens-ch.iam.gserviceaccount.com",
		private_key: "-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n",
		...overrides,
	});
}

function frontendKey(overrides = {}) {
	return JSON.stringify({ apiKey: "AIza-test", projectId: PROJECT, ...overrides });
}

describe("validateAdminKey", () => {
	it("accepts a well-formed key", () => {
		expect(validateAdminKey(adminKey(), PROJECT)).toEqual([]);
	});

	it("rejects an empty value", () => {
		expect(validateAdminKey("", PROJECT)).toHaveLength(1);
	});

	it("rejects a value pasted with surrounding quotes", () => {
		const problems = validateAdminKey(`"${adminKey()}"`, PROJECT);

		expect(problems.join(" ")).toContain("not valid JSON");
	});

	it("rejects a private key whose newlines were flattened", () => {
		const flattened = adminKey({ private_key: "-----BEGIN PRIVATE KEY-----MIIE-----END PRIVATE KEY-----" });

		expect(validateAdminKey(flattened, PROJECT).join(" ")).toContain("no line breaks");
	});

	it("rejects a key for the wrong project", () => {
		expect(validateAdminKey(adminKey({ project_id: "some-other" }), PROJECT).join(" "))
			.toContain("project_id is not giens-ch");
	});

	it("rejects a non-service-account key", () => {
		expect(validateAdminKey(adminKey({ type: "authorized_user" }), PROJECT).join(" "))
			.toContain("service_account");
	});

	it("rejects a key with no PEM block", () => {
		expect(validateAdminKey(adminKey({ private_key: "not-a-key\n" }), PROJECT).join(" "))
			.toContain("not a PEM block");
	});

	it("never includes the secret value in a problem message", () => {
		const problems = validateAdminKey(adminKey({ project_id: "wrong" }), PROJECT).join(" ");

		expect(problems).not.toContain("BEGIN PRIVATE KEY");
		expect(problems).not.toContain("firebase-adminsdk@");
	});
});

describe("validateFrontendKey", () => {
	it("accepts a well-formed config", () => {
		expect(validateFrontendKey(frontendKey(), PROJECT)).toEqual([]);
	});

	it("rejects a missing apiKey", () => {
		expect(validateFrontendKey(frontendKey({ apiKey: "" }), PROJECT).join(" ")).toContain("apiKey");
	});

	it("rejects a config for the wrong project", () => {
		expect(validateFrontendKey(frontendKey({ projectId: "other" }), PROJECT).join(" "))
			.toContain("projectId is not giens-ch");
	});
});

describe("validateCredentials", () => {
	it("reports problems from both keys at once", () => {
		const problems = validateCredentials({ FIREBASE_ADMIN_KEY: "", FIREBASE_FRONTEND_KEY: "" }, PROJECT);

		expect(problems).toHaveLength(2);
	});

	it("passes when both are well-formed", () => {
		const problems = validateCredentials(
			{ FIREBASE_ADMIN_KEY: adminKey(), FIREBASE_FRONTEND_KEY: frontendKey() },
			PROJECT,
		);

		expect(problems).toEqual([]);
	});
});
