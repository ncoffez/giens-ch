import type { GlobalSettings, User } from "../../types";

const settingsCache = ref<GlobalSettings | null>(null);
const userPreferenceCache = ref<Pick<User, "homesFeatureEnabled"> | null>(null);
const settingsLoading = ref(false);

export function useFeatureFlags() {
	const nuxtApp = useNuxtApp();
	const { $currentUser, $token } = nuxtApp;
	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));

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

	const fetchUserPreference = async (): Promise<Pick<User, "homesFeatureEnabled"> | null> => {
		if (userPreferenceCache.value) return userPreferenceCache.value;

		const uid = $currentUser?.value?.uid;
		if (!uid) return null;

		const token = $token?.value;
		const headers: Record<string, string> = {};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		try {
			const data = await $fetch<{ homesFeatureEnabled?: boolean }>(`/api/profile/${uid}`, { headers });
			userPreferenceCache.value = { homesFeatureEnabled: data.homesFeatureEnabled };
			return userPreferenceCache.value;
		} catch {
			return null;
		}
	};

	const isHomesFeatureGloballyEnabled = computed(() => {
		if (!settingsCache.value) return false;
		return settingsCache.value.homesFeatureGloballyEnabled === true;
	});

	const isHomesFeatureEnabledForUser = computed(() => {
		return userPreferenceCache.value?.homesFeatureEnabled === true;
	});

	const canAccessHomes = computed(() => {
		if (isAdmin.value) return true;
		if (isHomesFeatureEnabledForUser.value) return true;
		if (isHomesFeatureGloballyEnabled.value) return true;
		return false;
	});

	return {
		settings: settingsCache,
		userPreference: userPreferenceCache,
		settingsLoading,
		fetchSettings,
		fetchUserPreference,
		isHomesFeatureGloballyEnabled,
		isHomesFeatureEnabledForUser,
		canAccessHomes,
		isAdmin,
		clearUserPreferenceCache: () => {
			userPreferenceCache.value = null;
		},
	};
}