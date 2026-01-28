import { test, expect } from "../fixtures/console-monitor";
const { describe } = test;

describe("Critical User Flows with Console Error Detection", () => {
	test("news page loads and filters work", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/news");

		await expect(page.locator("h1")).toBeVisible();

		const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter"]');
		const hasFilter = await filterButton.count() > 0;

		if (hasFilter) {
			await expect(filterButton).toBeVisible();
		}

		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on /news:\n${consoleMonitor.getErrorSummary()}`);
		}
	});

	test("home page navigation works", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/");

		await expect(page.locator("h1")).toBeVisible();

		const newsLink = page.locator('a[href*="/news"], button:has-text("News")');
		await expect(newsLink.first()).toBeVisible();

		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on /:\n${consoleMonitor.getErrorSummary()}`);
		}
	});

	test("article page loads", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/news");
		await page.waitForLoadState("networkidle");

		const firstArticle = page.locator("article, [class*='card']").first();
		const count = await firstArticle.count();

		if (count > 0) {
			await firstArticle.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
			await expect(page.locator("h1, h2")).toBeVisible();
		}

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on article page:\n${consoleMonitor.getErrorSummary()}`);
		}
	});

	test("mobile navigation works on small screen", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/");
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const mobileNav = page.locator("nav.fixed.bottom-0");
		const hasMobileNav = await mobileNav.count() > 0;

		if (hasMobileNav) {
			await expect(mobileNav).toBeVisible();
		}

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on mobile navigation:\n${consoleMonitor.getErrorSummary()}`);
		}
	});

	test("language switcher works", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const langSwitcher = page.locator('button:has-text("DE"), button:has-text("EN")');
		const count = await langSwitcher.count();

		if (count > 0) {
			await expect(langSwitcher.first()).toBeVisible();
		}

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on language switcher:\n${consoleMonitor.getErrorSummary()}`);
		}
	});

	test("error pages exist", async ({ page, consoleMonitor }, testInfo) => {
		await page.goto("/non-existent-page-xyz-123");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const content = await page.content();
		expect(content.length).toBeGreaterThan(0);

		const errors = consoleMonitor.getErrors();
		if (errors.length > 0) {
			await consoleMonitor.attachToTestReport(testInfo);
			throw new Error(`Console errors on 404 page:\n${consoleMonitor.getErrorSummary()}`);
		}
	});
});