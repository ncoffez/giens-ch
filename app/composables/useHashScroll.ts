export function useHashScroll() {
	const route = useRoute();

	const scrollToHash = async (hash: string, maxRetries = 30) => {
		if (!hash) return;

		const elementId = hash.replace("#", "");

		for (let i = 0; i < maxRetries; i++) {
			const element = document.getElementById(elementId);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
				element.classList.add("search-highlight");
				setTimeout(() => element.classList.remove("search-highlight"), 2500);
				return;
			}
			await new Promise((r) => setTimeout(r, 100));
		}
	};

	const handleHashScroll = () => {
		if (route.hash) {
			scrollToHash(route.hash);
		}
	};

	watch(() => route.hash, (newHash, oldHash) => {
		if (newHash && newHash !== oldHash) {
			nextTick(() => scrollToHash(newHash));
		}
	}, { immediate: true });

	return {
		scrollToHash,
		handleHashScroll,
	};
}
