import { defineVitestConfig } from "@nuxt/test-utils/config";

process.env.FIREBASE_FRONTEND_KEY = JSON.stringify({ apiKey: "test" });

export default defineVitestConfig({
	test: {
		environment: "nuxt",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		include: [
			"**/*.test.ts",
			"**/*.test.js",
		],
		exclude: [
			"node_modules/**",
			"**/tests/e2e/**",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/**",
				"**/*.d.ts",
				"**/*.config.js",
				"**/*.config.ts",
				"**/tests/**",
				"**/coverage/**",
				"**/.nuxt/**",
				"**/.output/**",
				"**/.data/**",
				".firebase/**",
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 75,
				statements: 80,
			},
		},
	},
});
