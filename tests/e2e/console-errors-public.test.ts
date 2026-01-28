import { test, expect } from '../fixtures/console-monitor';

const PUBLIC_ROUTES = [
	"/",
	"/about",
	"/travel",
	"/login",
	"/register",
	"/reset-password",
];

test.describe("Public Routes - No Console Errors", () => {
	PUBLIC_ROUTES.forEach((route) => {
test(`${route}`, async ({ page, consoleMonitor }, testInfo) => {
			await page.goto(route);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);

			const errors = consoleMonitor.getErrors();
			
			if (errors.length > 0) {
				const errorMessage = `Console errors found on ${route}:\n${errors.map((e) => `  - ${e.message}`).join("\n")}`;
				await consoleMonitor.attachToTestReport(testInfo);
				throw new Error(errorMessage);
			}

			if (consoleMonitor.getWarnings().length > 0) {
				await consoleMonitor.attachWarningsToTestReport(testInfo);
			}
		});
	});
});