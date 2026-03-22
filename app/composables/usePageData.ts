import type { PageContent } from "../../types";

export async function usePageData<T>(contentId: string, defaultData: T) {
	const nuxtApp = useNuxtApp();
	const { token } = useAuthReady();
	const toast = useAppToast();

	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));
	const isEditing = ref(false);
	const isSaving = ref(false);
	const data = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;
	const originalData = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;

	const { data: responseData, status, refresh, error } = await useFetch<PageContent>(`/api/content/${contentId}`, {
		server: false,
		lazy: true,
	});

	watch(
		responseData,
		(newData) => {
			if (newData?.content) {
				try {
					const parsed = JSON.parse(newData.content);
					data.value = parsed;
					originalData.value = JSON.parse(JSON.stringify(parsed));
				} catch {
					data.value = JSON.parse(JSON.stringify(defaultData));
					originalData.value = JSON.parse(JSON.stringify(defaultData));
				}
			}
		},
		{ immediate: true },
	);

	const startEditing = () => {
		originalData.value = JSON.parse(JSON.stringify(data.value));
		isEditing.value = true;
	};

	const cancelEditing = () => {
		data.value = JSON.parse(JSON.stringify(originalData.value));
		isEditing.value = false;
	};

	const save = async () => {
		if (!token.value) return;

		isSaving.value = true;
		try {
			await $fetch(`/api/content/${contentId}`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { content: JSON.stringify(data.value) },
			});
			toast.success("Gespeichert", "Inhalt wurde erfolgreich gespeichert");
			isEditing.value = false;
			await refresh();
		} catch (e: unknown) {
			toast.error("Fehler", getFetchError(e) || "Speichern fehlgeschlagen");
		} finally {
			isSaving.value = false;
		}
	};

	return {
		data,
		status,
		error,
		isAdmin,
		isEditing,
		isSaving,
		startEditing,
		cancelEditing,
		save,
		refresh,
	};
}
