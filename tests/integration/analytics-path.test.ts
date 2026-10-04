import { describe, expect, it, vi } from "vitest";
import {
	analyticsHistoryUrl,
	analyticsLocation,
	analyticsPagePath,
	analyticsReferrer,
	installAnalyticsHistoryGuard,
	setAnalyticsSink,
	trackAnalyticsEvent,
} from "../../app/utils/analytics";

const ORIGIN = "https://giens.ch";

describe("analytics page path", () => {
	it("keeps ordinary pages", () => {
		expect(analyticsPagePath("/")).toBe("/");
		expect(analyticsPagePath("/entdecken")).toBe("/entdecken");
		expect(analyticsPagePath("/fr/travel")).toBe("/fr/travel");
	});

	it("removes the share token and the query string", () => {
		expect(analyticsPagePath("/homes/share/266395b6-028b-42d0-94e9-bae169568fc3")).toBe("/homes/share");
		expect(analyticsPagePath("/fr/homes/share/secret-token?from=mail")).toBe("/fr/homes/share");
	});
});

describe("analytics locations", () => {
	it("builds a same-origin URL without the token", () => {
		expect(analyticsLocation("/fr/homes/share/secret-token?from=mail", ORIGIN)).toBe(`${ORIGIN}/fr/homes/share`);
		expect(analyticsLocation("/entdecken", ORIGIN)).toBe(`${ORIGIN}/entdecken`);
	});

	it("keeps an outside referrer and strips our own share token", () => {
		expect(analyticsReferrer("https://mail.google.com/mail/u/0/", ORIGIN)).toBe("https://mail.google.com/mail/u/0/");
		expect(analyticsReferrer(`${ORIGIN}/homes/share/secret-token`, ORIGIN)).toBe(`${ORIGIN}/homes/share`);
		expect(analyticsReferrer("", ORIGIN)).toBe("");
	});

	it("only rewrites history URLs that carry a share token", () => {
		expect(analyticsHistoryUrl("/entdecken?lang=de", ORIGIN)).toBe("/entdecken?lang=de");
		expect(analyticsHistoryUrl("/homes/share/secret-token?from=mail", ORIGIN)).toBe("/homes/share");
		expect(analyticsHistoryUrl(`${ORIGIN}/fr/homes/share/secret-token`, ORIGIN)).toBe(`${ORIGIN}/fr/homes/share`);
	});
});

describe("analytics history guard", () => {
	it("lets the history hook see the share page and keeps the token in the address bar", () => {
		installAnalyticsHistoryGuard();
		const seen: string[] = [];
		const previous = history.pushState.bind(history);
		history.pushState = function (state, title, url) {
			seen.push(String(url));
			previous(state, title, url);
		};

		history.pushState({ current: "/homes/share/secret-token" }, "", "/homes/share/secret-token?from=mail");

		expect(seen).toEqual(["/homes/share"]);
		expect(window.location.pathname).toBe("/homes/share/secret-token");
		expect(window.location.search).toBe("?from=mail");
	});

	it("leaves an ordinary navigation untouched", () => {
		installAnalyticsHistoryGuard();
		const seen: string[] = [];
		const previous = history.pushState.bind(history);
		history.pushState = function (state, title, url) {
			seen.push(String(url));
			previous(state, title, url);
		};

		history.pushState(null, "", "/entdecken");

		expect(seen).toEqual(["/entdecken"]);
		expect(window.location.pathname).toBe("/entdecken");
	});
});

describe("analytics event queue", () => {
	it("holds events until a sink exists, then flushes them once", () => {
		const sink = vi.fn();
		trackAnalyticsEvent("share_view", { audience: "prospect", home_name: "Haus 6" });
		expect(sink).not.toHaveBeenCalled();

		setAnalyticsSink(sink);
		expect(sink).toHaveBeenCalledTimes(1);
		expect(sink).toHaveBeenCalledWith("share_view", { audience: "prospect", home_name: "Haus 6" });

		trackAnalyticsEvent("share_view", { audience: "tenant", home_name: "Haus 21" });
		expect(sink).toHaveBeenCalledTimes(2);
		setAnalyticsSink(null);
	});
});
