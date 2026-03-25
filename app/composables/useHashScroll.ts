export function useHashScroll() {
	const route = useRoute();
	const hasScrolledForPath = ref<string | null>(null);

	const scrollToHash = async (hash: string, maxRetries = 30) => {
		if (!hash) return;

		const elementId = hash.replace("#", "");
		const pathKey = route.path + hash;

		if (hasScrolledForPath.value === pathKey) return;

		for (let i = 0; i < maxRetries; i++) {
			const element = document.getElementById(elementId);
			if (element) {
				const top = element.getBoundingClientRect().top + window.scrollY - 112;
				window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
				element.classList.add("search-highlight");
				setTimeout(() => element.classList.remove("search-highlight"), 2500);
				hasScrolledForPath.value = pathKey;
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

	watch(() => route.path, () => {
		hasScrolledForPath.value = null;
	});

	watch(() => route.hash, (newHash, oldHash) => {
		if (newHash && newHash !== oldHash && oldHash !== undefined) {
			nextTick(() => scrollToHash(newHash));
		}
	});

	return {
		scrollToHash,
		handleHashScroll,
	};
}
