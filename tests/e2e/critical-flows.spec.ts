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

		const mobileNav = page.locator("[data-mobile-nav]");
		await expect(mobileNav).toBeVisible();
	});

	test("mobile navigation moves to a side rail in landscape mobile view", async ({ page }) => {
		await page.goto("/");
		await page.setViewportSize({ width: 844, height: 390 });

		const mobileNav = page.locator("[data-mobile-nav]");
		await expect(mobileNav).toBeVisible();

		const box = await mobileNav.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.x).toBeLessThan(24);
		expect(box!.width).toBeLessThan(120);
	});

	test("error pages exist", async ({ page }) => {
		await page.goto("/non-existent-page-xyz-123");
		const content = await page.content();
		expect(content.length).toBeGreaterThan(0);
	});
});
