const searchModalOpen = ref(false);

export function useSearchModal() {
	const open = computed({
		get: () => searchModalOpen.value,
		set: (value: boolean) => {
			searchModalOpen.value = value;
		},
	});

	const openSearch = () => {
		searchModalOpen.value = true;
	};

	const closeSearch = () => {
		searchModalOpen.value = false;
	};

	return {
		open,
		openSearch,
		closeSearch,
	};
}
