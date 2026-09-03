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
		await expect(mobileNav.getByRole("link", { name: "Home" })).toBeVisible();
		await expect(mobileNav.getByRole("link", { name: "Entdecken" })).toBeVisible();
		await expect(mobileNav.getByRole("link", { name: "Organisatorisches" })).toBeVisible();
		await expect(mobileNav.getByRole("button", { name: "Menü öffnen" })).toBeVisible();
		await expect(mobileNav.getByRole("link", { name: "Anreise" })).toHaveCount(0);
	});

	test("mobile menu sheet opens with search and logged-out destinations", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const menuButton = page.getByRole("button", { name: "Menü öffnen" });
		await expect(menuButton).toBeVisible();
		await menuButton.click();
		await expect(menuButton).toHaveAttribute("aria-expanded", "true");

		const menu = page.locator("[data-mobile-menu]");
		await expect(menu).toBeVisible({ timeout: 10_000 });
		await expect(page.getByPlaceholder("Suchen oder navigieren...")).toBeVisible();
		await expect(menu.getByRole("heading")).toHaveCount(0);
		await expect(menu.getByRole("link", { name: "Anreise" })).toBeVisible();
		await expect(menu.getByRole("link", { name: "Login" })).toBeVisible();
		await expect(menu.getByRole("link", { name: "Eigentümer-Dokumente" })).toHaveCount(0);

		await menu.getByRole("link", { name: "Anreise" }).click();
		await expect(page).toHaveURL(/\/travel/);
		await expect(page.locator("[data-mobile-menu]")).toBeHidden();
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
