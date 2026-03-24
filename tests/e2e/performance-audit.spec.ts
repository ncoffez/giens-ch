import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface RouteAudit {
	route: string;
	jsBytes: number;
	requestCount: number;
	fetchCount: number;
	scriptCount: number;
	lcpMs: number | null;
	longTaskCount: number;
	longTaskDurationMs: number;
}

const routes = ["/", "/travel", "/entdecken"];
const reportDir = path.resolve("reports/performance");
const reportPath = path.join(reportDir, "page-audit.json");

test.describe("Performance Audit", () => {
	test("captures public route performance metrics", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "PerformanceObserver metrics are only collected in Chromium.");

		const audits: RouteAudit[] = [];

		for (const route of routes) {
			let jsBytes = 0;
			let requestCount = 0;
			let fetchCount = 0;
			let scriptCount = 0;

			page.removeAllListeners("response");
			page.on("response", async (response) => {
				const request = response.request();
				const type = request.resourceType();
				requestCount += 1;

				if (type === "fetch" || type === "xhr") {
					fetchCount += 1;
				}

				if (type === "script") {
					scriptCount += 1;
					const lengthHeader = response.headers()["content-length"];
					if (lengthHeader) {
						jsBytes += Number(lengthHeader);
						return;
					}

					try {
						const body = await response.body();
						jsBytes += body.byteLength;
					} catch {
					}
				}
			});

			await page.addInitScript(() => {
				(window as any).__perfAudit = {
					lcpMs: null,
					longTaskCount: 0,
					longTaskDurationMs: 0,
				};

				const perfAudit = (window as any).__perfAudit;

				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						perfAudit.lcpMs = entry.startTime;
					}
				}).observe({ type: "largest-contentful-paint", buffered: true });

				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						perfAudit.longTaskCount += 1;
						perfAudit.longTaskDurationMs += entry.duration;
					}
				}).observe({ type: "longtask", buffered: true });
			});

			await page.goto(route, { waitUntil: "networkidle" });

			const perfAudit = await page.evaluate(() => (window as any).__perfAudit);
			audits.push({
				route,
				jsBytes,
				requestCount,
				fetchCount,
				scriptCount,
				lcpMs: perfAudit?.lcpMs ?? null,
				longTaskCount: perfAudit?.longTaskCount ?? 0,
				longTaskDurationMs: Number((perfAudit?.longTaskDurationMs ?? 0).toFixed(2)),
			});
		}

		await mkdir(reportDir, { recursive: true });
		await writeFile(reportPath, `${JSON.stringify({
			generatedAt: new Date().toISOString(),
			routes: audits,
		}, null, "\t")}\n`, "utf8");

		expect(audits).toHaveLength(routes.length);
		for (const audit of audits) {
			expect(audit.requestCount).toBeGreaterThan(0);
			expect(audit.scriptCount).toBeGreaterThan(0);
		}
	});
});
