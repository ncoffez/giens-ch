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
	},
});
