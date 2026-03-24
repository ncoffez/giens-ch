import type { PageContent } from "../../types";

export async function usePageContent(contentId: string) {
	const nuxtApp = useNuxtApp();
	const { token } = useAuthReady();
	const toast = useAppToast();
	const { locale } = useI18n();

	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));
	const isEditing = ref(false);
	const isSaving = ref(false);
	const content = ref("");
	const originalContent = ref("");

	const { data, status, refresh, error } = await useFetch<PageContent>(`/api/content/${contentId}`, {
		server: false,
		lazy: true,
		query: { locale },
	});

	function extractContent(data: PageContent | null | undefined, currentLocale: string): string {
		if (!data) return "";
		
		if (typeof data.content === "string") {
			if (currentLocale === "fr" && data.translated?.fr) {
				return data.translated.fr;
			}
			return data.content;
		}
		
		if (typeof data.content === "object" && data.content !== null) {
			const localizedContent = data.content as { de?: string; fr?: string };
			return localizedContent[currentLocale as "de" | "fr"] || localizedContent.de || "";
		}
		
		return "";
	}

	watch(
		data,
		(newData) => {
			if (newData) {
				content.value = extractContent(newData, locale.value);
				originalContent.value = content.value;
			}
		},
		{ immediate: true },
	);

	watch(locale, () => {
		if (data.value) {
			content.value = extractContent(data.value, locale.value);
			originalContent.value = content.value;
		}
	});

	const startEditing = () => {
		originalContent.value = content.value;
		isEditing.value = true;
	};

	const cancelEditing = () => {
		content.value = originalContent.value;
		isEditing.value = false;
	};

	const save = async () => {
		if (!token.value) return;

		isSaving.value = true;
		try {
			await $fetch(`/api/content/${contentId}`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: { content: content.value },
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
		content,
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
