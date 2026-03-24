import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
	"/",
	"/travel",
	"/entdecken",
	"/login",
	"/register",
	"/reset-password",
];

test.describe("Public Routes - Basic Load Test", () => {
	PUBLIC_ROUTES.forEach((route) => {
		test(`${route}`, async ({ page }) => {
			await page.goto(route);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);

			expect(page.url()).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):3000\//);
		});
	});
});
