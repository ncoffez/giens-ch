interface ErrorToastOptions {
	report?: boolean;
	source?: string;
	statusCode?: number;
	stack?: string;
}

export function shouldReportErrorToast(options: ErrorToastOptions = {}) {
	return options.report ?? true;
}

export const useAppToast = () => {
	const toast = useToast();
	const reporter = import.meta.client ? useErrorReporter() : null;

	const error = (title: string, description?: string, options: ErrorToastOptions = {}) => {
		const textToCopy = description || title;
		const shouldReport = shouldReportErrorToast(options);
		const message = description || title;

		if (import.meta.client && reporter && shouldReport) {
			reporter.captureError({
				message,
				source: options.source || "toast-error",
				statusCode: options.statusCode,
				stack: options.stack,
			});
		}
		
		return toast.add({
			title,
			description,
			color: "error",
			icon: "i-lucide-circle-alert",
			actions: [
				{
					label: "Kopieren",
					icon: "i-lucide-copy",
					color: "neutral",
					variant: "ghost",
					onClick: () => {
						navigator.clipboard.writeText(textToCopy);
					}
				}
			]
		});
	};

	const success = (title: string, description?: string) => {
		return toast.add({
			title,
			description,
			color: "success",
			icon: "i-lucide-check-circle"
		});
	};

	return {
		...toast,
		error,
		success
	};
};
