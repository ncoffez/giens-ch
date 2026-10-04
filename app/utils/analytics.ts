const SHARE_TOKEN = /\/homes\/share\/[^/?#]+/g;
const SHARE_TOKEN_TEST = /\/homes\/share\/[^/?#]+/;

export interface AnalyticsParams {
	[key: string]: string;
}

type AnalyticsSink = (name: string, params: AnalyticsParams) => void;
type HistoryMethod = History["pushState"];

const queued: Array<{ name: string; params: AnalyticsParams }> = [];
let sink: AnalyticsSink | null = null;
let historyGuardInstalled = false;
let historyDepth = 0;

/** Drop the secret share token and any query string before a path is sent. */
export function analyticsPagePath(fullPath: string): string {
	const path = fullPath.split(/[?#]/)[0] || "/";
	return path.replace(SHARE_TOKEN, "/homes/share");
}

/** Full URL safe to store: same origin, no share token, no query. */
export function analyticsLocation(href: string, origin: string): string {
	try {
		const url = new URL(href, origin);
		return `${origin}${analyticsPagePath(`${url.pathname}${url.search}${url.hash}`)}`;
	} catch {
		return `${origin}${analyticsPagePath(href)}`;
	}
}

/** Keep an outside referrer. Strip a share token from our own pages. */
export function analyticsReferrer(referrer: string, origin: string): string {
	if (!referrer) return "";
	try {
		const url = new URL(referrer);
		if (url.origin !== origin) return referrer;
		return analyticsLocation(referrer, origin);
	} catch {
		return "";
	}
}

/**
 * URL a history hook may see. Unchanged unless it contains a share token.
 * Relative URLs stay relative so the address bar can be restored afterwards.
 */
export function analyticsHistoryUrl(url: string, origin: string): string {
	if (!SHARE_TOKEN_TEST.test(url)) return url;

	try {
		const parsed = new URL(url, origin);
		const path = analyticsPagePath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
		if (url.startsWith("http://") || url.startsWith("https://")) return `${parsed.origin}${path}`;
		return path;
	} catch {
		return analyticsPagePath(url);
	}
}

/**
 * Stay wrapped around history so a later gtag hook sees the share page
 * without its token. The address bar keeps the real URL.
 */
export function installAnalyticsHistoryGuard(): void {
	if (!import.meta.client || historyGuardInstalled) return;
	historyGuardInstalled = true;

	installHistoryMethod("pushState", history.pushState.bind(history));
	installHistoryMethod("replaceState", history.replaceState.bind(history));
}

function installHistoryMethod(name: "pushState" | "replaceState", native: HistoryMethod) {
	let inner: HistoryMethod = native;
	const wrapper: HistoryMethod = function (state, title, url) {
		if (historyDepth > 0) {
			native.call(history, state, title, url);
			return;
		}

		const raw = url == null ? null : String(url);
		const cleaned = raw == null ? null : analyticsHistoryUrl(raw, window.location.origin);
		const changed = raw != null && cleaned !== raw;
		historyDepth += 1;
		try {
			inner.call(history, state, title, changed ? cleaned : url);
			if (changed && raw != null) {
				native.call(history, history.state, "", raw);
			}
		} finally {
			historyDepth -= 1;
		}
	};

	try {
		Object.defineProperty(history, name, {
			configurable: true,
			enumerable: true,
			get() {
				return wrapper;
			},
			set(next: HistoryMethod) {
				if (typeof next === "function" && next !== wrapper) inner = next;
			},
		});
	} catch {
		history[name] = wrapper;
	}
}

export function setAnalyticsSink(next: AnalyticsSink | null) {
	sink = next;
	if (!sink) return;

	const waiting = queued.splice(0, queued.length);
	for (const event of waiting) {
		sink(event.name, event.params);
	}
}

export function trackAnalyticsEvent(name: string, params: AnalyticsParams = {}) {
	if (!import.meta.client) return;
	if (sink) {
		sink(name, params);
		return;
	}

	if (queued.length < 20) {
		queued.push({ name, params });
	}
}
