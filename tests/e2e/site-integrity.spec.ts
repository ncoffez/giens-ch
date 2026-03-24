import { test, expect } from "@playwright/test";

test.describe("Site Integrity", () => {
	test("should load the home page", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toContainText("Willkommen im Beausoleil");
	});

	test("should have no horizontal scrollbar on mobile", async ({ page, isMobile }) => {
		if (!isMobile) return;
		await page.goto("/");
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBe(clientWidth);
	});

	test("language switcher should not shift layout", async ({ page, isMobile }) => {
		if (!isMobile) return;
		
		await page.goto("/");
		
		// Capture initial position of logo
		const logo = page.locator("#logo");
		const initialBox = await logo.boundingBox();
		
		// Open language switcher - button shows locale name (Deutsch)
		const langButton = page.locator("header").getByRole("button", { name: /Deutsch|Français/ });
		await langButton.click();
		
		// Capture position after opening
		const finalBox = await logo.boundingBox();
		
		expect(initialBox?.x).toBe(finalBox?.x);
	});

	test("bottom navigation should be visible on mobile", async ({ page, isMobile }) => {
		if (!isMobile) return;
		await page.goto("/");
		const mobileNav = page.locator("nav.fixed.bottom-0");
		await expect(mobileNav).toBeVisible();
	});

	test("should navigate to travel page and show Google Maps button", async ({ page }) => {
		await page.goto("/travel");
		
		const mapsButton = page.getByRole("link", { name: "Route planen" });
		await expect(mapsButton).toBeVisible();
		await expect(mapsButton).toHaveAttribute("href", /google\.com\/maps/);
	});

	test("should load entdecken page and show markets section", async ({ page }) => {
		await page.goto("/entdecken");

		await expect(page.locator("#maerkte")).toBeVisible();
	});
});
