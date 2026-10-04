import { getApps, initializeApp } from "firebase/app";
import {
	analyticsLocation,
	analyticsPagePath,
	analyticsReferrer,
	installAnalyticsHistoryGuard,
	setAnalyticsSink,
	type AnalyticsParams,
} from "~/utils/analytics";

interface FirebaseWebConfig {
	measurementId?: unknown;
}

interface GtagWindow extends Window {
	dataLayer?: unknown[];
	gtag?: (...args: unknown[]) => void;
}

function measurementId(): string {
	const config = useRuntimeConfig();
	try {
		const parsed = JSON.parse(config.public.FIREBASE_FRONTEND_KEY || "{}") as FirebaseWebConfig;
		return typeof parsed.measurementId === "string" ? parsed.measurementId : "";
	} catch {
		return "";
	}
}

function shouldCollect(): boolean {
	if (!import.meta.client) return false;
	const host = window.location.hostname;
	if (host === "localhost" || host === "127.0.0.1" || host === "") return false;
	return measurementId().startsWith("G-");
}

/** Queue a sanitized page before gtag.js loads, so the first hit omits the share token. */
function seedPage(fullPath: string) {
	const pagePath = analyticsPagePath(fullPath);
	const origin = window.location.origin;
	const pageLocation = analyticsLocation(pagePath, origin);
	const pageReferrer = analyticsReferrer(document.referrer, origin);
	const target = window as GtagWindow;
	const dataLayer = target.dataLayer || [];
	target.dataLayer = dataLayer;
	if (!target.gtag) {
		target.gtag = function gtag() {
			const layer = (window as GtagWindow).dataLayer || dataLayer;
			layer.push(arguments);
		};
	}
	target.gtag("set", {
		send_page_view: false,
		page_path: pagePath,
		page_location: pageLocation,
		page_referrer: pageReferrer,
	});
	return { pagePath, pageLocation, pageReferrer };
}

export default defineNuxtPlugin(() => {
	if (!shouldCollect()) return;

	installAnalyticsHistoryGuard();
	const router = useRouter();
	const seeded = seedPage(router.currentRoute.value.fullPath);
	let lastPath = "";

	void (async () => {
		const { initializeAnalytics, isSupported, logEvent } = await import("firebase/analytics");
		if (!(await isSupported())) return;

		const config = useRuntimeConfig();
		const firebaseConfig = JSON.parse(config.public.FIREBASE_FRONTEND_KEY || "{}");
		const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
		const analytics = initializeAnalytics(app, {
			config: {
				send_page_view: false,
				page_path: seeded.pagePath,
				page_location: seeded.pageLocation,
				page_referrer: seeded.pageReferrer,
				allow_google_signals: false,
				allow_ad_personalization_signals: false,
			},
		});

		const trackPage = (fullPath: string) => {
			const pagePath = analyticsPagePath(fullPath);
			if (pagePath === lastPath) return;
			lastPath = pagePath;
			const origin = window.location.origin;
			logEvent(analytics, "page_view", {
				page_path: pagePath,
				page_location: analyticsLocation(pagePath, origin),
				page_referrer: analyticsReferrer(document.referrer, origin),
				page_title: document.title,
				language: document.documentElement.lang || "de",
			});
		};

		setAnalyticsSink((name: string, params: AnalyticsParams) => {
			logEvent(analytics, name, params);
		});

		router.afterEach((to) => {
			void nextTick(() => {
				trackPage(to.fullPath);
			});
		});
		void nextTick(() => {
			trackPage(router.currentRoute.value.fullPath);
		});
	})().catch(() => {
		setAnalyticsSink(null);
	});
});
