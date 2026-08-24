import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("#build/fetch.mjs", () => ({
	$fetch: fetchMock,
}));

vi.mock("#imports", () => ({
	$fetch: fetchMock,
}));

// Import the LOGIC functions directly for honest testing
import { isAdminLogic } from "../../app/middleware/is-admin.ts";
import { isOwnerLogic } from "../../app/middleware/is-owner.ts";
import { isPublisherLogic } from "../../app/middleware/is-publisher.ts";
import { isLoggedInLogic } from "../../app/middleware/is-logged-in.ts";
import { isNotLoggedInLogic } from "../../app/middleware/is-not-logged-in.ts";
import { homeOwnerLogic } from "../../app/middleware/home-owner.ts";

// Mutable mock state
const mockNuxtApp = {
	$isAdmin: ref(false),
	$isOwner: ref(false),
	$isPublisher: ref(false),
	$currentUser: ref(null as any),
	$authInitialized: ref(true),
	$token: ref("test-token"),
};

describe("Middleware Logic (Honest Integration)", () => {
	beforeEach(() => {
		mockNuxtApp.$isAdmin.value = false;
		mockNuxtApp.$isOwner.value = false;
		mockNuxtApp.$isPublisher.value = false;
		mockNuxtApp.$currentUser.value = null;
		mockNuxtApp.$token.value = "test-token";
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	it("isAdminLogic: allows admin, redirects non-admin", async () => {
		mockNuxtApp.$isAdmin.value = true;
		expect(await isAdminLogic(mockNuxtApp)).toBe(true);

		mockNuxtApp.$isAdmin.value = false;
		expect(await isAdminLogic(mockNuxtApp)).toBe("/");
	});

	it("isOwnerLogic: allows owner, redirects non-owner", async () => {
		mockNuxtApp.$currentUser.value = { uid: "test" };
		mockNuxtApp.$isOwner.value = true;
		expect(await isOwnerLogic(mockNuxtApp)).toBe(true);

		mockNuxtApp.$currentUser.value = { uid: "test" };
		mockNuxtApp.$isOwner.value = false;
		expect(await isOwnerLogic(mockNuxtApp)).toBe("/");
	});

	it("homeOwnerLogic: does not allow admins to bypass home ownership", async () => {
		mockNuxtApp.$isAdmin.value = true;
		fetchMock.mockRejectedValue({
			response: { status: 403 },
		});
		vi.stubGlobal("$fetch", fetchMock);

		await expect(homeOwnerLogic(mockNuxtApp, "home-1")).resolves.toEqual({
			redirect: "/",
			reason: "not_owner",
		});
	});

	it("isPublisherLogic: allows publisher, redirects non-publisher", async () => {
		mockNuxtApp.$isPublisher.value = true;
		expect(await isPublisherLogic(mockNuxtApp)).toBe(true);

		mockNuxtApp.$isPublisher.value = false;
		expect(await isPublisherLogic(mockNuxtApp)).toBe("/");
	});

	it("isLoggedInLogic: allows logged in, redirects not logged in", async () => {
		mockNuxtApp.$currentUser.value = { uid: "test" };
		expect(await isLoggedInLogic(mockNuxtApp)).toBe(true);

		mockNuxtApp.$currentUser.value = null;
		expect(await isLoggedInLogic(mockNuxtApp, { redirectPath: "/documents?folder=abc&fileId=123" })).toBe("/login?redirect=%2Fdocuments%3Ffolder%3Dabc%26fileId%3D123");
	});

	it("isNotLoggedInLogic: allows not logged in, redirects logged in", async () => {
		mockNuxtApp.$currentUser.value = null;
		expect(await isNotLoggedInLogic(mockNuxtApp)).toBe(true);

		mockNuxtApp.$currentUser.value = { uid: "test" };
		expect(await isNotLoggedInLogic(mockNuxtApp, "/documents?fileId=123")).toBe("/documents?fileId=123");
	});
});
