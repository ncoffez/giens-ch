const searchModalOpen = ref(false);
const searchModalMounted = ref(false);

export function useSearchModal() {
	const open = computed({
		get: () => searchModalOpen.value,
		set: (value: boolean) => {
			searchModalOpen.value = value;
		},
	});

	const openSearch = () => {
		searchModalMounted.value = true;
		searchModalOpen.value = true;
	};

	const closeSearch = () => {
		searchModalOpen.value = false;
	};

	return {
		open,
		isMounted: searchModalMounted,
		openSearch,
		closeSearch,
	};
}
