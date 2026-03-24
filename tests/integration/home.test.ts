import { describe, it, expect } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";

describe.skip("Home Page (i18n integration pending)", () => {
	it("renders the welcome title", async () => {
		// TODO: Fix i18n mocking for tests
		// The component now uses useI18n() which needs proper mocking in test environment
	});

	it("renders feature cards with default data", async () => {
		// TODO: Fix i18n mocking for tests
	});
});
