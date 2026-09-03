const mobileMenuOpen = ref(false);
const mobileMenuMounted = ref(false);

export function useMobileMenu() {
	const open = computed({
		get: () => mobileMenuOpen.value,
		set: (value: boolean) => {
			mobileMenuOpen.value = value;
		},
	});

	const openMenu = () => {
		mobileMenuMounted.value = true;
		mobileMenuOpen.value = true;
	};

	const closeMenu = () => {
		mobileMenuOpen.value = false;
	};

	return {
		open,
		isMounted: mobileMenuMounted,
		openMenu,
		closeMenu,
	};
}
