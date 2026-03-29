import { describe, expect, it } from "vitest";
import {
	createAutomaticIssueBody,
	createGithubIssueLabels,
	createIssueBody,
	createIssueCommentBody,
	createIssueTitle,
	shouldSkipAutomaticGithubIssue,
} from "../../app/utils/errorReporting";

describe("error reporting utils", () => {
	const report = {
		title: "Seite nicht gefunden",
		message: "Seite nicht gefunden",
		occurredAt: "2026-03-29T08:00:00.000Z",
		source: "route-not-found",
		statusCode: 404,
		routePath: "/falsche-route",
		url: "https://giens-ch.web.app/falsche-route",
		previousRoute: "/travel",
		referrer: "https://giens-ch.web.app/travel",
		locale: "fr",
		viewport: "390x844",
		authState: "anonymous" as const,
		actions: [
			{
				type: "route-change" as const,
				label: "/travel -> /falsche-route",
				timestamp: "29.03.2026, 08:00:00",
			},
		],
		stack: "Error: Not found",
	};

	it("creates a concise issue title with status and route", () => {
		expect(createIssueTitle(report)).toContain("404");
		expect(createIssueTitle(report)).toContain("/falsche-route");
	});

	it("includes user input and technical context in the issue body", () => {
		const body = createIssueBody(report, {
			userNotes: "Beim Oeffnen eines alten Links landet man auf einer Fehlerseite.",
		});

		expect(body).toContain("Beim Oeffnen eines alten Links");
		expect(body).toContain("## Technische Details");
		expect(body).toContain("Quelle: route-not-found");
		expect(body).toContain("Route: /falsche-route");
		expect(body).toContain("[route-change] /travel -> /falsche-route");
		expect(body).toContain("Error: Not found");
	});

	it("creates an automatic issue body without requiring user notes", () => {
		const body = createAutomaticIssueBody(report);

		expect(body).toContain("Automatisch erstellt");
		expect(body).toContain("## Technische Details");
		expect(body).not.toContain("## Zusaetzlicher Nutzerkommentar");
	});

	it("creates a dedicated comment body for follow-up user context", () => {
		const body = createIssueCommentBody(report, {
			userNotes: "Ich kam ueber einen veralteten Link aus dem Mail.",
		});

		expect(body).toContain("## Zusaetzlicher Nutzerkommentar");
		expect(body).toContain("veralteten Link");
	});

	it("filters obvious bot-like 404 noise from automatic GitHub issue creation", () => {
		expect(shouldSkipAutomaticGithubIssue({
			source: "route-not-found",
			statusCode: 404,
			routePath: "/wp-admin/install.php",
		})).toBe(true);

		expect(shouldSkipAutomaticGithubIssue({
			source: "route-not-found",
			statusCode: 404,
			routePath: "/fr/entdecken",
		})).toBe(false);
	});

	it("derives useful GitHub labels from the report context", () => {
		expect(createGithubIssueLabels(report)).toEqual(
			expect.arrayContaining(["auto-reported", "route-404"]),
		);

		expect(createGithubIssueLabels({
			...report,
			source: "page-content-save",
			statusCode: 500,
		}, {
			hasUserNotes: true,
		})).toEqual(
			expect.arrayContaining(["auto-reported", "save-failure", "user-confirmed"]),
		);

		expect(createGithubIssueLabels({
			...report,
			source: "window-error",
			statusCode: 500,
		})).toEqual(
			expect.arrayContaining(["auto-reported", "runtime-error"]),
		);
	});
});
