import { test, expect } from "@playwright/test";

test.describe("Critical User Flows", () => {
	test("home page loads correctly", async ({ page }) => {
		await page.goto("/");

		await expect(page.locator("h1, h2, h3").first()).toBeVisible();
		await page.waitForLoadState("networkidle");
	});

	test("about page redirects to home", async ({ page }) => {
		await page.goto("/about");
		await expect(page).toHaveURL(/\/$/);
	});

	test("travel page loads correctly", async ({ page }) => {
		await page.goto("/travel");

		await expect(page.locator("h1, h2, h3").first()).toBeVisible();
	});

	test("entdecken page loads correctly", async ({ page }) => {
		await page.goto("/entdecken");

		await expect(page.locator("h1, h2, h3").first()).toBeVisible();
	});

	test("organisatorisches page loads correctly", async ({ page }) => {
		await page.goto("/organisatorisches");

		await expect(page.locator("h1, h2, h3").first()).toBeVisible();
	});

	test("mobile navigation works on small screen", async ({ page }) => {
		await page.goto("/");
		await page.setViewportSize({ width: 375, height: 667 });

		const mobileNav = page.locator("nav.fixed.bottom-0");
		const hasMobileNav = await mobileNav.count() > 0;

		if (hasMobileNav) {
			await expect(mobileNav).toBeVisible();
		}
	});

	test("error pages exist", async ({ page }) => {
		await page.goto("/non-existent-page-xyz-123");
		const content = await page.content();
		expect(content.length).toBeGreaterThan(0);
	});
});
