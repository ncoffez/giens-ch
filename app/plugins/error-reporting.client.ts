export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter();
	const reporter = useErrorReporter();
	const toast = useAppToast();

	reporter.recordAction({
		type: "page-load",
		label: window.location.pathname + window.location.search + window.location.hash,
	});

	router.afterEach((to, from) => {
		reporter.recordRouteChange(to.fullPath, from.fullPath || null);
	});

	const onClick = (event: MouseEvent) => {
		const target = event.target instanceof HTMLElement
			? event.target.closest("a, button, [role='button'], input[type='submit']")
			: null;

		if (target instanceof HTMLElement) {
			reporter.trackClick(target);
		}
	};

	const notifyError = (message: string) => {
		toast.add({
			title: "Fehler erkannt",
			description: `${message} Der Fehler wurde automatisch protokolliert. Optional koennen Sie weitere Details ergaenzen.`,
			color: "error",
			icon: "i-lucide-bug",
		});
	};

	const onWindowError = (event: ErrorEvent) => {
		reporter.captureError({
			message: event.message || "Unbekannter Laufzeitfehler",
			source: "window-error",
			stack: event.error instanceof Error ? event.error.stack : undefined,
		});
		notifyError(event.message || "Unbekannter Laufzeitfehler");
	};

	const onUnhandledRejection = (event: PromiseRejectionEvent) => {
		const reason = event.reason instanceof Error
			? event.reason.message
			: typeof event.reason === "string"
				? event.reason
				: "Unbehandelte Promise-Ablehnung";
		reporter.captureError({
			message: reason,
			source: "unhandled-rejection",
			stack: event.reason instanceof Error ? event.reason.stack : undefined,
		});
		notifyError(reason);
	};

	document.addEventListener("click", onClick, true);
	window.addEventListener("error", onWindowError);
	window.addEventListener("unhandledrejection", onUnhandledRejection);

	nuxtApp.hook("vue:error", (error, _instance, info) => {
		const message = error instanceof Error ? error.message : String(error);
		reporter.captureError({
			message,
			source: `vue-error:${info || "unknown"}`,
			stack: error instanceof Error ? error.stack : undefined,
		});
		notifyError(message);
	});
});
