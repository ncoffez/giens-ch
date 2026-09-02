// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	experimental: {
		// Nuxt rewrites the entry chunk to the bare specifier "#entry" and resolves it
		// through an <script type="importmap">. Safari only supports import maps from
		// iOS/iPadOS 16.4, so older iPads/iPhones crash with
		// 'Module specifier, "#entry" does not start with "/", "./", or "../"'.
		// Keep the plain relative entry filename instead.
		entryImportMap: false,
	},
	modules: ["@nuxt/ui", "@nuxtjs/i18n"],
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
	i18n: {
		locales: [
			{ code: 'de', language: 'de-CH', name: 'Deutsch', file: 'de.json' },
			{ code: 'fr', language: 'fr-CH', name: 'Français', file: 'fr.json' },
		],
		defaultLocale: 'de',
		strategy: 'prefix_except_default',
		lazy: true,
		langDir: 'locales',
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_locale',
			fallbackLocale: 'de',
		},
	},
	runtimeConfig: {
		public: {
			FIREBASE_FRONTEND_KEY: process.env.FIREBASE_FRONTEND_KEY,
			SITE_URL: process.env.SITE_URL || "https://giens.ch",
			GITHUB_REPO: process.env.GITHUB_REPO || "ncoffez/giens-ch",
		},
		FIREBASE_ADMIN_KEY: process.env.FIREBASE_ADMIN_KEY,
		UNSPLASH_API_KEY: process.env.UNSPLASH_API_KEY,
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
		DOCUMENT_TRANSLATION_LANGUAGES: process.env.DOCUMENT_TRANSLATION_LANGUAGES || "fr",
		GITHUB_ISSUES_TOKEN: process.env.GITHUB_ISSUES_TOKEN,
	},
	nitro: {
		preset: "firebase",
		firebase: {
			gen: 2,
			nodeVersion: "22",
			httpsOptions: {
				region: "europe-west6",
				maxInstances: 5,
				cpu: "gcf_gen1"
			},
		},
	},
	routeRules: {
		"/about": { redirect: "/" },
		"/fr/about": { redirect: "/fr" },
		// i18n strategy is "prefix_except_default" with defaultLocale "de",
		// so German lives at "/" and "/de" is not a route at all (issue #4).
		// It is the most guessable URL for a German site, so redirect instead of 404.
		"/de": { redirect: "/" },
		"/de/**": { redirect: "/**" },
	},
	hooks: {
		'nitro:config': (config) => {
			// @ts-ignore
			config.runtimeConfig.nitro = config.runtimeConfig.nitro || {};
			// @ts-ignore
			config.runtimeConfig.nitro.bodySizeLimit = '25mb';
		}
	}
});
