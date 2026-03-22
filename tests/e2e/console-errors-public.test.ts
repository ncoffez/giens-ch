import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
	"/",
	"/about",
	"/travel",
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

			expect(page.url()).toContain("localhost:3000");
		});
	});
});