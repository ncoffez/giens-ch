import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://127.0.0.1:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		{
			name: "mobile-safari",
			use: { ...devices["iPhone 14"] },
		},
		{
			name: "mobile-chrome",
			use: { ...devices["Pixel 7"] },
		},
	],
	testIgnore: process.env.PLAYWRIGHT_SMOKE ? [
		"tests/e2e/console-errors-all-routes.test.ts",
		"tests/e2e/site-integrity.spec.ts",
	] : undefined,
	webServer: {
		command: process.env.PLAYWRIGHT_PREVIEW ? "npm run preview:prod" : "npm run dev -- --host 127.0.0.1 --port 3000",
		url: "http://127.0.0.1:3000",
		reuseExistingServer: !process.env.CI,
		// A cold Nuxt dev start (first Vite dep optimisation after a clean install)
		// exceeds Playwright's 60s default. Measured ~50s warm, longer cold.
		timeout: 180_000,
	},
});
