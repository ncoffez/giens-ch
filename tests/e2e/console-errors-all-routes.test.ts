import { test, expect } from '../fixtures/console-monitor';

const ALL_ROUTES = [
	"/",
	"/about",
	"/travel",
	"/login",
	"/register",
	"/reset-password",
	"/news",
	"/news/news",
	"/news/dokumente",
	"/news/photos",
	"/news/travaux",
	"/news/events",
	"/news/all",
	"/news/eigentuemerversammlung",
	"/profile",
	"/profile/me",
	"/profile/me/password",
	"/profile/me/picture",
	"/admin",
	"/admin/homes",
	"/admin/users",
	"/admin/labels",
	"/admin/settings",
	"/owner",
	"/owner/contacts",
	"/owner/photos",
	"/owner/documents",
	"/owner/news",
	"/homes",
	"/homes/new",
];

test.describe("All Routes - Console Error Detection", () => {
	let errorCount = 0;

	test.beforeEach(() => {
		errorCount = 0;
	});

	test.afterAll(async () => {
		if (errorCount > 0) {
			// Summary will be in test report
		}
	});

	ALL_ROUTES.forEach((route) => {
		test(`${route}`, async ({ page, consoleMonitor }, testInfo) => {
			await page.goto(route);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);

			const errors = consoleMonitor.getErrors();
			const warnings = consoleMonitor.getWarnings();

			if (errors.length > 0 || warnings.length > 0) {
				errorCount++;
				await testInfo.attach("route-console-log", {
					body: JSON.stringify({ errors, warnings, route }, null, 2),
					contentType: "application/json",
				});
			}

			if (errors.length > 0) {
				const errorMessage = `Console errors on ${route}:\n${errors.map((e) => `  ${e.message}`).join("\n")}`;
				throw new Error(errorMessage);
			}
		});
	});
});