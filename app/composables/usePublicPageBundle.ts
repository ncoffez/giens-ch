import type { PageContent, LocalizedContent } from "../../types";

type PublicPageKey = "home" | "travel" | "entdecken";

interface PublicPageBundleResponse {
	page: PublicPageKey;
	sections: Record<string, PageContent>;
}

function cloneDefault<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

function extractLocalizedString(data: PageContent | null | undefined, locale: string): string {
	if (!data) return "";

	if (typeof data.content === "string") {
		if (locale === "fr" && data.translated?.fr) {
			return data.translated.fr;
		}

		return data.content;
	}

	const localizedContent = data.content as LocalizedContent;
	return localizedContent[locale as "de" | "fr"] || localizedContent.de || "";
}

function parseLocalizedJson<T>(data: PageContent | null | undefined, locale: string, fallback: T): T {
	const raw = extractLocalizedString(data, locale);
	if (!raw) return cloneDefault(fallback);

	try {
		return JSON.parse(raw) as T;
	} catch {
		return cloneDefault(fallback);
	}
}

export async function usePublicPageBundle(page: PublicPageKey) {
	const nuxtApp = useNuxtApp();
	const { token } = useAuthReady();
	const toast = useAppToast();
	const { locale } = useI18n();
	const sections = ref<Record<string, PageContent>>({});
	const isAdmin = computed(() => (import.meta.client ? nuxtApp.$isAdmin?.value : false));

	const fetchKey = computed(() => `public-page-content:${page}:${locale.value}`);
	const { data, status, refresh, error } = await useFetch<PublicPageBundleResponse>(() => `/api/page-content/${page}`, {
		key: fetchKey,
		query: { locale },
	});

	watch(
		data,
		(newData) => {
			sections.value = newData?.sections || {};
		},
		{ immediate: true },
	);

	watch(locale, () => {
		sections.value = data.value?.sections || {};
	});

	const saveSection = async (contentId: string, content: string) => {
		if (!token.value) return;

		await $fetch(`/api/content/${contentId}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { content },
		});
	};

	function createContentSection(contentId: string, defaultContent = "") {
		const isEditing = ref(false);
		const isSaving = ref(false);
		const content = ref(defaultContent);
		const originalContent = ref(defaultContent);

		const syncFromBundle = () => {
			content.value = extractLocalizedString(sections.value[contentId], locale.value) || defaultContent;
			originalContent.value = content.value;
		};

		watch([sections, locale], syncFromBundle, { immediate: true });

		return {
			content,
			status,
			error,
			isAdmin,
			isEditing,
			isSaving,
			startEditing: () => {
				originalContent.value = content.value;
				isEditing.value = true;
			},
			cancelEditing: () => {
				content.value = originalContent.value;
				isEditing.value = false;
			},
			save: async () => {
				if (!token.value) return;

				isSaving.value = true;
				try {
					await saveSection(contentId, content.value);
					toast.success("Gespeichert", "Inhalt wurde erfolgreich gespeichert");
					isEditing.value = false;
					await refresh();
				} catch (e: unknown) {
					toast.error("Fehler", getFetchError(e) || "Speichern fehlgeschlagen");
				} finally {
					isSaving.value = false;
				}
			},
			refresh,
		};
	}

	function createDataSection<T>(contentId: string, defaultData: T) {
		const isEditing = ref(false);
		const isSaving = ref(false);
		const sectionData = ref<T>(cloneDefault(defaultData)) as Ref<T>;
		const originalData = ref<T>(cloneDefault(defaultData)) as Ref<T>;

		const syncFromBundle = () => {
			const nextValue = parseLocalizedJson(sections.value[contentId], locale.value, defaultData);
			sectionData.value = nextValue;
			originalData.value = cloneDefault(nextValue);
		};

		watch([sections, locale], syncFromBundle, { immediate: true });

		return {
			data: sectionData,
			status,
			error,
			isAdmin,
			isEditing,
			isSaving,
			startEditing: () => {
				originalData.value = cloneDefault(sectionData.value);
				isEditing.value = true;
			},
			cancelEditing: () => {
				sectionData.value = cloneDefault(originalData.value);
				isEditing.value = false;
			},
			save: async () => {
				if (!token.value) return;

				isSaving.value = true;
				try {
					await saveSection(contentId, JSON.stringify(sectionData.value));
					toast.success("Gespeichert", "Inhalt wurde erfolgreich gespeichert");
					isEditing.value = false;
					await refresh();
				} catch (e: unknown) {
					toast.error("Fehler", getFetchError(e) || "Speichern fehlgeschlagen");
				} finally {
					isSaving.value = false;
				}
			},
			refresh,
		};
	}

	return {
		createContentSection,
		createDataSection,
		status,
		error,
		refresh,
	};
}

export { extractLocalizedString, parseLocalizedJson };
