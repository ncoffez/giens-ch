import { fileURLToPath } from "node:url";
import { defineVitestConfig } from "@nuxt/test-utils/config";

process.env.FIREBASE_FRONTEND_KEY = JSON.stringify({ apiKey: "test" });
process.env.FIREBASE_ADMIN_KEY = JSON.stringify({
	project_id: "test-project",
	client_email: "test@example.com",
	private_key: "-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----\\n",
});

export default defineVitestConfig({
	resolve: {
		alias: {
			"#app-manifest": fileURLToPath(new URL("./tests/mocks/app-manifest.ts", import.meta.url)),
		},
	},
	define: {
		"process.server": "false",
		"process.client": "true",
	},
	test: {
		environment: "nuxt",

		globals: true,
		setupFiles: ["./tests/setup.ts"],
		outputFile: "./coverage-result.json",
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
				"**/coverage/**",
				"node_modules/**",
				"**/*.d.ts",
				"**/*.config.js",
				"**/*.config.ts",
				"**/tests/**",

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
