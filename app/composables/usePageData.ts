import type { PageContent, LocalizedContent } from "../../types";
import { isSourceEditableLocale } from "../utils/contentEditing";

export async function usePageData<T>(contentId: string, defaultData: T) {
	const nuxtApp = useNuxtApp();
	const { getFreshToken } = useAuthReady();
	const { authorizedFetch } = useApi();
	const toast = useAppToast();
	const i18n = useI18n();

	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));
	const isEditing = ref(false);
	const isSaving = ref(false);
	const data = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;
	const originalData = ref<T>(JSON.parse(JSON.stringify(defaultData))) as Ref<T>;
	const activeLocale = computed(() => i18n.locale?.value || "de");
	const canEdit = computed(() => isAdmin.value && isSourceEditableLocale(activeLocale.value));
	const fetchKey = computed(() => `content-data:${contentId}:${activeLocale.value}`);

	const { data: responseData, status, refresh, error } = await useFetch<PageContent>(() => `/api/content/${contentId}`, {
		key: fetchKey,
		query: { locale: activeLocale },
	});

	function parseContent(content: string | LocalizedContent, translated?: { fr?: string }): T {
		let contentStr: string;
		
		if (typeof content === "string") {
			contentStr = activeLocale.value === "fr" && translated?.fr 
				? translated.fr 
				: content;
		} else if (typeof content === "object" && content !== null) {
			contentStr = content[activeLocale.value as "de" | "fr"] || content.de || "";
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

	watch(activeLocale, () => {
		if (responseData.value?.content !== undefined) {
			const parsed = parseContent(responseData.value.content, responseData.value.translated);
			data.value = parsed;
			originalData.value = JSON.parse(JSON.stringify(parsed));
		}
	});

	const startEditing = () => {
		if (!canEdit.value) return;
		originalData.value = JSON.parse(JSON.stringify(data.value));
		isEditing.value = true;
	};

	const cancelEditing = () => {
		data.value = JSON.parse(JSON.stringify(originalData.value));
		isEditing.value = false;
	};

	const save = async () => {
		if (!canEdit.value) return;
		const token = await getFreshToken();
		if (!token) return;

		isSaving.value = true;
		try {
			await authorizedFetch(`/api/content/${contentId}`, {
				method: "POST",
				forceRefresh: true,
				body: { content: JSON.stringify(data.value) },
			});
			toast.success("Gespeichert", "Inhalt wurde erfolgreich gespeichert");
			isEditing.value = false;
			await refresh();
		} catch (e: unknown) {
			toast.error("Fehler", getFetchError(e) || "Speichern fehlgeschlagen", {
				source: "page-data-save",
			});
		} finally {
			isSaving.value = false;
		}
	};

	return {
		data,
		status,
		error,
		isAdmin,
		canEdit,
		isEditing,
		isSaving,
		startEditing,
		cancelEditing,
		save,
		refresh,
	};
}
