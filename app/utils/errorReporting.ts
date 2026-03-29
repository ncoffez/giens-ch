export interface ErrorReportAction {
	type: "page-load" | "route-change" | "click" | "error";
	label: string;
	timestamp: string;
	details?: string;
}

export interface ErrorReportPayload {
	eventId?: string;
	githubIssueNumber?: number;
	githubIssueUrl?: string;
	title: string;
	message: string;
	occurredAt: string;
	source: string;
	statusCode?: number;
	routePath: string;
	url?: string;
	previousRoute?: string;
	referrer?: string;
	locale?: string;
	userAgent?: string;
	viewport?: string;
	authState?: "authenticated" | "anonymous";
	userId?: string;
	actions: ErrorReportAction[];
	stack?: string;
}

export interface ErrorReportSubmissionInput {
	userNotes?: string;
}

interface GithubLabelOptions {
	hasUserNotes?: boolean;
}

const AUTOMATIC_ISSUE_NOISE_PATTERNS = [
	/\/wp-admin/i,
	/\/wp-login/i,
	/wordpress/i,
	/xmlrpc\.php/i,
	/\.php(?:$|[/?#])/i,
	/\.asp(?:x)?(?:$|[/?#])/i,
	/\/cgi-bin\//i,
	/\/phpmyadmin/i,
	/\/adminer/i,
	/\/boaform/i,
	/\/HNAP1/i,
	/\/manager\/html/i,
	/\/server-status/i,
	/\/autodiscover\//i,
	/\/vendor\/phpunit/i,
	/\/\.git(?:\/|$)/i,
	/\/\.env(?:$|[.?/#])/i,
];

function truncate(value: string, length: number) {
	return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function createReportSignature(report: Pick<ErrorReportPayload, "source" | "statusCode" | "routePath" | "message">) {
	return [
		report.source,
		report.statusCode || "",
		report.routePath || "/",
		report.message || "",
	].join("::");
}

export function shouldSkipAutomaticGithubIssue(report: Pick<ErrorReportPayload, "routePath" | "statusCode" | "source">) {
	if (report.statusCode !== 404 && report.source !== "route-not-found") {
		return false;
	}

	const routePath = (report.routePath || "/").toLowerCase();
	return AUTOMATIC_ISSUE_NOISE_PATTERNS.some((pattern) => pattern.test(routePath));
}

function formatActions(actions: ErrorReportAction[]) {
	if (!actions.length) {
		return "- Keine aufgezeichneten Aktionen";
	}

	return actions.map((action) => {
		const details = action.details ? ` (${action.details})` : "";
		return `- ${action.timestamp}: [${action.type}] ${action.label}${details}`;
	}).join("\n");
}

export function createIssueTitle(report: ErrorReportPayload) {
	const routeSuffix = report.routePath || "/";
	const statusPrefix = report.statusCode ? `${report.statusCode} ` : "";
	return truncate(`[Bug] ${statusPrefix}${report.message} (${routeSuffix})`, 120);
}

export function createGithubIssueLabels(report: ErrorReportPayload, options: GithubLabelOptions = {}) {
	const labels = new Set<string>(["auto-reported"]);
	const source = (report.source || "").toLowerCase();

	if (options.hasUserNotes) {
		labels.add("user-confirmed");
	}

	if (report.statusCode === 404 || source === "route-not-found") {
		labels.add("route-404");
	}

	if (source.includes("save")) {
		labels.add("save-failure");
	}

	if (source.includes("upload")) {
		labels.add("upload-failure");
	}

	if (source.includes("toast")) {
		labels.add("handled-error");
	}

	if (source.includes("window-error") || source.includes("vue-error") || source.includes("unhandled-rejection")) {
		labels.add("runtime-error");
	}

	return Array.from(labels);
}

function createTechnicalDetails(report: ErrorReportPayload) {
	return [
		"## Technische Details",
		`- Quelle: ${report.source}`,
		`- Event-ID: ${report.eventId || "Nicht verfügbar"}`,
		`- Zeitpunkt: ${report.occurredAt}`,
		`- Route: ${report.routePath}`,
		`- URL: ${report.url || "Nicht verfügbar"}`,
		`- Vorherige Route: ${report.previousRoute || "Nicht verfügbar"}`,
		`- Referrer: ${report.referrer || "Nicht verfügbar"}`,
		`- Status: ${report.statusCode || "Nicht verfügbar"}`,
		`- Locale: ${report.locale || "Nicht verfügbar"}`,
		`- Viewport: ${report.viewport || "Nicht verfügbar"}`,
		`- Auth: ${report.authState || "Nicht verfügbar"}`,
		`- User-ID: ${report.userId || "Nicht verfügbar"}`,
		"",
		"## Fehlermeldung",
		"```text",
		report.message || "Keine Fehlermeldung vorhanden.",
		"```",
		"",
		"## Benutzeraktionen",
		formatActions(report.actions),
		"",
		"## Stacktrace",
		"```text",
		truncate(report.stack || "Kein Stacktrace verfügbar.", 6000),
		"```",
	];
}

export function createAutomaticIssueBody(report: ErrorReportPayload) {
	return [
		"## Erfassungsart",
		"Automatisch erstellt aus dem Fehler-Tracking der Website.",
		"",
		...createTechnicalDetails(report),
	].join("\n");
}

export function createIssueCommentBody(report: ErrorReportPayload, submission: ErrorReportSubmissionInput) {
	return [
		"## Zusaetzlicher Nutzerkommentar",
		submission.userNotes?.trim() || "Kein zusaetzlicher Kommentar angegeben.",
		"",
		...createTechnicalDetails(report),
	].join("\n");
}

export function createIssueBody(report: ErrorReportPayload, submission: ErrorReportSubmissionInput) {
	return createIssueCommentBody(report, submission);
}
