import { describe, expect, it } from "vitest";
import {
	PERMISSION_PROBES,
	interpretProbe,
	probePermissions,
	resolveAccessToken,
	runDeployPermissionCheck,
} from "../../scripts/check-deploy-permissions.mjs";

function jsonResponse(status) {
	return { status };
}

describe("deploy IAM probe", () => {
	it("never looks up a Storage bucket", () => {
		const urls = PERMISSION_PROBES.map((probe) => probe.url({
			projectId: "giens-ch",
			bucket: "giens-ch.appspot.com",
		}));

		expect(urls.join(" ")).not.toContain("defaultBucket");
		expect(urls.join(" ")).not.toContain("firebasestorage.googleapis.com");
		expect(urls.every((url) => url.endsWith(":test"))).toBe(true);
	});

	it("maps a rules 403 to firebaserules.admin", () => {
		const probe = PERMISSION_PROBES.find((item) => item.id === "firestore-rules-test");

		expect(interpretProbe(probe, 403)).toContain("roles/firebaserules.admin");
		expect(interpretProbe(probe, 400)).toBeNull();
		expect(interpretProbe(probe, 200)).toBeNull();
	});

	it("compiles Storage rules through the same :test API", () => {
		const probe = PERMISSION_PROBES.find((item) => item.id === "storage-rules-test");

		expect(probe.body()).toContain("service firebase.storage");
		expect(interpretProbe(probe, 403)).toContain("roles/firebaserules.admin");
		expect(interpretProbe(probe, 400)).toBeNull();
	});

	it("accepts live 200s from both APIs", async () => {
		const { problems } = await probePermissions({
			token: "test-token",
			fetchImpl: async () => jsonResponse(200),
		});

		expect(problems).toEqual([]);
	});

	it("fails closed when rules compile is forbidden", async () => {
		const { problems } = await probePermissions({
			token: "test-token",
			fetchImpl: async (url) => jsonResponse(url.includes(":test") ? 403 : 200),
		});

		expect(problems.join(" ")).toContain("roles/firebaserules.admin");
		expect(problems.join(" ")).not.toContain("test-token");
	});

	it("uses an env token before ADC", async () => {
		const token = await resolveAccessToken({
			env: { GOOGLE_ACCESS_TOKEN: "from-env" },
			loadGoogleAuth: async () => {
				throw new Error("should not load ADC");
			},
		});

		expect(token).toBe("from-env");
	});

	it("fails in CI when there is no token", async () => {
		const result = await runDeployPermissionCheck({
			env: { CI: "true" },
			loadGoogleAuth: async () => null,
		});

		expect(result.skipped).toBe(false);
		expect(result.problems.join(" ")).toContain("access token");
	});

	it("skips locally when there is no token", async () => {
		const result = await runDeployPermissionCheck({
			env: {},
			loadGoogleAuth: async () => null,
		});

		expect(result.skipped).toBe(true);
		expect(result.problems).toEqual([]);
	});

	it("maps a 401 to an auth failure, not a missing role", () => {
		const probe = PERMISSION_PROBES.find((item) => item.id === "firestore-rules-test");

		expect(interpretProbe(probe, 401)).toContain("not authenticated");
	});

	it("records a network error without leaking the token", async () => {
		const { problems } = await probePermissions({
			token: "secret-token",
			fetchImpl: async () => {
				throw new Error("socket hang up");
			},
		});

		expect(problems.join(" ")).toContain("socket hang up");
		expect(problems.join(" ")).not.toContain("secret-token");
	});

	it("loads ADC when no env token is set", async () => {
		class FakeGoogleAuth {
			async getClient() {
				return {
					async getAccessToken() {
						return { token: "adc-token" };
					},
				};
			}
		}

		const token = await resolveAccessToken({
			env: {},
			loadGoogleAuth: async () => FakeGoogleAuth,
		});

		expect(token).toBe("adc-token");
	});

	it("passes the live probe when both APIs answer 200", async () => {
		const result = await runDeployPermissionCheck({
			env: { GOOGLE_ACCESS_TOKEN: "ci-token" },
			fetchImpl: async () => jsonResponse(200),
		});

		expect(result.skipped).toBe(false);
		expect(result.problems).toEqual([]);
	});
});
