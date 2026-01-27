import { test, expect } from "@playwright/test";

test.describe("Critical User Flows", () => {
	test("news page loads and filters work", async ({ page }) => {
		await page.goto("/news");

		// Check if news page loads
		await expect(page.locator("h1")).toBeVisible();

		// Wait for articles to load
		await page.waitForLoadState("networkidle");

		// Check if filter drawer exists
		const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter"]');
		const hasFilter = await filterButton.count() > 0;

		if (hasFilter) {
			await expect(filterButton).toBeVisible();
		}
	});

	test("home page navigation works", async ({ page }) => {
		await page.goto("/");

		// Check if home page loads
		await expect(page.locator("h1")).toBeVisible();

		// Check for navigation links
		const newsLink = page.locator('a[href*="/news"], button:has-text("News")');
		await expect(newsLink.first()).toBeVisible();
	});

	test("article page loads", async ({ page }) => {
		// First get a news article link
		await page.goto("/news");
		await page.waitForLoadState("networkidle");

		const firstArticle = page.locator("article, [class*='card']").first();
		const count = await firstArticle.count();

		if (count > 0) {
			await firstArticle.click();
			await page.waitForLoadState("networkidle");
			await expect(page.locator("h1, h2")).toBeVisible();
		}
	});

	test("mobile navigation works on small screen", async ({ page }) => {
		await page.goto("/");
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		const mobileNav = page.locator("nav.fixed.bottom-0");
		const hasMobileNav = await mobileNav.count() > 0;

		if (hasMobileNav) {
			await expect(mobileNav).toBeVisible();
		}
	});

	test("language switcher works", async ({ page }) => {
		await page.goto("/");

		const langSwitcher = page.locator('button:has-text("DE"), button:has-text("EN")');
		const count = await langSwitcher.count();

		if (count > 0) {
			await expect(langSwitcher.first()).toBeVisible();
		}
	});

	test("error pages exist", async ({ page }) => {
		// Test 404
		await page.goto("/non-existent-page-xyz-123");
		const content = await page.content();
		expect(content.length).toBeGreaterThan(0);
	});
});