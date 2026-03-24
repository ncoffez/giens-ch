import type { PageContent, LocalizedContent } from "../../types";

export async function usePageData<T>(contentId: string, defaultData: T) {
	const nuxtApp = useNuxtApp();
	const { token } = useAuthReady();
	const toast = useAppToast();
	const { locale } = useI18n();

	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));
	const isEditing = ref(false);
	const isSaving = ref(false);
	const data = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;
	const originalData = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;
	const fetchKey = computed(() => `content-data:${contentId}:${locale.value}`);

	const { data: responseData, status, refresh, error } = await useFetch<PageContent>(() => `/api/content/${contentId}`, {
		key: fetchKey,
		query: { locale },
	});

	function parseContent(content: string | LocalizedContent, translated?: { fr?: string }): T {
		let contentStr: string;
		
		if (typeof content === "string") {
			contentStr = locale.value === "fr" && translated?.fr 
				? translated.fr 
				: content;
		} else if (typeof content === "object" && content !== null) {
			contentStr = content[locale.value as "de" | "fr"] || content.de || "";
		} else {
			return JSON.parse(JSON.stringify(defaultData));
		}
		
		try {
			return JSON.parse(contentStr);
		} catch {
			return JSON.parse(JSON.stringify(defaultData));
		}
	}

	watch(
		responseData,
		(newData) => {
			if (newData?.content !== undefined) {
				const parsed = parseContent(newData.content, newData.translated);
				data.value = parsed;
				originalData.value = JSON.parse(JSON.stringify(parsed));
			}
		},
		{ immediate: true },
	);

	watch(locale, () => {
		if (responseData.value?.content !== undefined) {
			const parsed = parseContent(responseData.value.content, responseData.value.translated);
			data.value = parsed;
			originalData.value = JSON.parse(JSON.stringify(parsed));
		}
	});

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
