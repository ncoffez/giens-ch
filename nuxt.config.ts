// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/ui"],
	routeRules: {
		"/about": { redirect: "/#geschichte" },
	},
	icon: process.env.NODE_ENV !== 'test'
		? {
			provider: 'server',
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
		UNSPLASH_API_KEY: process.env.UNSPLASH_API_KEY,
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
	// Global body limit for H3
	hooks: {
		'nitro:config': (config) => {
			// @ts-ignore
			config.runtimeConfig.nitro = config.runtimeConfig.nitro || {};
			// @ts-ignore
			config.runtimeConfig.nitro.bodySizeLimit = '25mb';
		}
	}
});
