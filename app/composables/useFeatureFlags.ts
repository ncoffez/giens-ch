import type { GlobalSettings } from "../../types";

const settingsCache = ref<GlobalSettings | null>(null);
const settingsLoading = ref(false);

export function useFeatureFlags() {
	const nuxtApp = useNuxtApp();
	const isAdmin = computed(() => import.meta.client ? nuxtApp.$isAdmin?.value : false);

	const fetchSettings = async (): Promise<GlobalSettings | null> => {
		if (settingsCache.value) return settingsCache.value;
		
		settingsLoading.value = true;
		try {
			const data = await $fetch<GlobalSettings>("/api/settings");
			settingsCache.value = data;
			return data;
		} catch {
			return null;
		} finally {
			settingsLoading.value = false;
		}
	};

	const isHomesFeatureEnabled = computed(() => {
		if (!settingsCache.value) return false;
		return settingsCache.value.homesFeatureEnabled === true;
	});

	const canAccessHomes = computed(() => {
		if (isAdmin.value) return true;
		return isHomesFeatureEnabled.value;
	});

	return {
		settings: settingsCache,
		settingsLoading,
		fetchSettings,
		isHomesFeatureEnabled,
		canAccessHomes,
		isAdmin,
	};
}
