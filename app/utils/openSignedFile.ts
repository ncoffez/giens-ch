/**
 * Opens a signed file URL after an async fetch.
 *
 * iOS Safari (and some Android browsers) ignore `window.open` once the
 * original tap is no longer a user gesture — which is always true after
 * `await`. Open a blank tab synchronously, then navigate it to the URL.
 */
export async function openAfterAsyncNavigation(
	fetchUrl: () => Promise<string>,
): Promise<void> {
	if (typeof window === "undefined") {
		return;
	}

	const popup = window.open("about:blank", "_blank");

	try {
		const url = await fetchUrl();

		if (popup && !popup.closed) {
			popup.location.replace(url);
			return;
		}

		const link = document.createElement("a");
		link.href = url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		document.body.appendChild(link);
		link.click();
		link.remove();
	} catch (error) {
		popup?.close();
		throw error;
	}
}
