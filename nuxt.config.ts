// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/ui", "@nuxt/icon"],
	icon: process.env.NODE_ENV !== 'test'
		? {
			provider: 'none',
			clientBundle: {
				scan: {
					globInclude: [
						'{app}/**',
						'node_modules/@nuxt/ui/dist/**',
					],
					globExclude: ['node_modules'],
				},
				sizeLimitKb: 512,
			},
		}
		: {
			// Test-only configuration to avoid icon loading errors
			provider: 'none',
			clientBundle: {
				scan: {
					globInclude: [
						'{app,shared}/**',
						'node_modules/@nuxt/ui/dist/**',
					],
					globExclude: ['node_modules'],
				},
				sizeLimitKb: 512,
			},
		},
	css: ["@/assets/main.css", "@/assets/prose.css"],
	runtimeConfig: {
		public: {
			FIREBASE_FRONTEND_KEY: process.env.FIREBASE_FRONTEND_KEY,
			TEST_VARIABLE: process.env.TEST_VARIABLE,
		},
		FIREBASE_ADMIN_KEY: process.env.FIREBASE_ADMIN_KEY,
		TEST_SECRET: process.env.TEST_SECRET,
	},
	nitro: {
		preset: "firebase",
		firebase: {
			gen: 2,
			httpsOptions: {
				region: "europe-west6",
				maxInstances: 5,
				cpu: "gcf_gen1"
			},
		},
	},

});
