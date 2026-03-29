import type { ErrorReportAction, ErrorReportPayload } from "../utils/errorReporting";
import { createReportSignature } from "../utils/errorReporting";

interface CaptureErrorInput {
	message: string;
	source: string;
	statusCode?: number;
	stack?: string;
}

function nowIso() {
	return new Date().toISOString();
}

function buildActionTimestamp() {
	return new Date().toLocaleString("de-CH", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function trimText(value: string | null | undefined, length = 120) {
	return (value || "").replace(/\s+/g, " ").trim().slice(0, length);
}

export function useErrorReporter() {
	const route = useRoute();
	const nuxtApp = useNuxtApp();
	const runtimeConfig = useRuntimeConfig();
	const activeLocale = computed(() => {
		const i18n = (nuxtApp as unknown as { $i18n?: { locale?: { value?: string } } }).$i18n;
		return i18n?.locale?.value || "de";
	});
	const actions = useState<ErrorReportAction[]>("error-report-actions", () => []);
	const activeReport = useState<ErrorReportPayload | null>("error-report-active", () => null);
	const previousRoute = useState<string | null>("error-report-previous-route", () => null);
	const isDialogOpen = useState<boolean>("error-report-dialog-open", () => false);
	const lastSignature = useState<string>("error-report-signature", () => "");
	const lastCapturedAt = useState<number>("error-report-last-captured-at", () => 0);
	const autoReportedSignatures = useState<Record<string, string>>("error-report-auto-reported", () => ({}));

	const canCreateIssue = computed(() => Boolean(runtimeConfig.public.GITHUB_REPO));

	function recordAction(action: Omit<ErrorReportAction, "timestamp">) {
		actions.value = [
			...actions.value.slice(-24),
			{
				...action,
				timestamp: buildActionTimestamp(),
			},
		];
	}

	function recordRouteChange(to: string, from?: string | null) {
		if (from) {
			previousRoute.value = from;
		}

		recordAction({
			type: "route-change",
			label: `${from || "(initial)"} -> ${to}`,
		});
	}

	function getSnapshot(input: CaptureErrorInput): ErrorReportPayload {
		const currentUser = import.meta.client ? nuxtApp.$currentUser?.value : null;
		const message = trimText(input.message, 400) || "Unbekannter Fehler";

		return {
			title: message,
			message,
			occurredAt: nowIso(),
			source: input.source,
			statusCode: input.statusCode,
			routePath: route.fullPath || route.path || "/",
			url: import.meta.client ? window.location.href : undefined,
			previousRoute: previousRoute.value || undefined,
			referrer: import.meta.client ? document.referrer || undefined : undefined,
			locale: activeLocale.value,
			userAgent: import.meta.client ? navigator.userAgent : undefined,
			viewport: import.meta.client ? `${window.innerWidth}x${window.innerHeight}` : undefined,
			authState: currentUser ? "authenticated" : "anonymous",
			userId: currentUser?.uid || undefined,
			actions: actions.value.slice(-15),
			stack: input.stack,
		};
	}

	function captureError(input: CaptureErrorInput) {
		const signature = `${input.source}:${input.statusCode || ""}:${input.message}:${route.fullPath || route.path}`;
		const capturedAt = Date.now();
		if (lastSignature.value === signature && capturedAt - lastCapturedAt.value < 3000) {
			return;
		}

		lastSignature.value = signature;
		lastCapturedAt.value = capturedAt;

		recordAction({
			type: "error",
			label: trimText(input.message, 180) || "Unbekannter Fehler",
			details: input.source,
		});

		const snapshot = getSnapshot(input);
		activeReport.value = snapshot;

		if (import.meta.client) {
			void submitAutomaticReport(snapshot);
		}
	}

	async function submitAutomaticReport(report: ErrorReportPayload) {
		const signature = createReportSignature(report);
		if (autoReportedSignatures.value[signature]) {
			activeReport.value = {
				...(activeReport.value || report),
				eventId: autoReportedSignatures.value[signature],
			};
			return;
		}

		try {
			const result = await $fetch<{
				id: string;
				githubIssueNumber?: number;
				githubIssueUrl?: string;
			}>("/api/error-events", {
				method: "POST",
				body: { report },
			});

			autoReportedSignatures.value = {
				...autoReportedSignatures.value,
				[signature]: result.id,
			};

			if (activeReport.value && createReportSignature(activeReport.value) === signature) {
				activeReport.value = {
					...activeReport.value,
					eventId: result.id,
					githubIssueNumber: result.githubIssueNumber,
					githubIssueUrl: result.githubIssueUrl,
				};
			}
		} catch {
			// Avoid surfacing secondary reporting errors to users while handling the original issue.
		}
	}

	function clearReport() {
		activeReport.value = null;
		isDialogOpen.value = false;
	}

	function openDialog() {
		isDialogOpen.value = true;
	}

	function closeDialog() {
		isDialogOpen.value = false;
	}

	function trackClick(target: HTMLElement) {
		const label = trimText(
			target.getAttribute("aria-label")
			|| target.getAttribute("title")
			|| target.textContent
			|| target.getAttribute("href")
			|| target.tagName,
			120,
		);

		if (!label) {
			return;
		}

		const details = target instanceof HTMLAnchorElement
			? target.href
			: target.getAttribute("data-report-detail") || undefined;

		recordAction({
			type: "click",
			label,
			details: details ? trimText(details, 180) : undefined,
		});
	}

	return {
		actions,
		activeReport,
		canCreateIssue,
		isDialogOpen,
		recordAction,
		recordRouteChange,
		captureError,
		clearReport,
		openDialog,
		closeDialog,
		trackClick,
	};
}
