interface SearchResult {
	id: string;
	label: string;
	context?: string;
	to: string;
	icon?: string;
	type: "page" | "heading" | "feature" | "timeline" | "document";
}

interface StoredHeading {
	id: string;
	text: string;
	context: string;
	page: string;
	pagePath: string;
}

interface StoredFeature {
	id: string;
	title: string;
	description: string;
}

interface StoredTimeline {
	id: string;
	title: string;
	description: string;
	date: string;
}

interface StoredDocument {
	id: string;
	name: string;
	type: string;
	description?: string;
}

const headingsCache = ref<StoredHeading[]>([]);
const featuresCache = ref<StoredFeature[]>([]);
const timelineCache = ref<StoredTimeline[]>([]);
const documentsCache = ref<StoredDocument[]>([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const loadedLocale = ref<string | null>(null);

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/é/g, "e")
		.replace(/è/g, "e")
		.replace(/ê/g, "e")
		.replace(/à/g, "a")
		.replace(/ù/g, "u")
		.replace(/ç/g, "c")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function stripHtml(html: string): string {
	if (!html) return "";
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractHeadingsFromHtml(html: string, page: string, pagePath: string): StoredHeading[] {
	if (!html) return [];
	
	const headings: StoredHeading[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match;
	
	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (headingText && headingText.length > 2) {
			const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
			const context = stripHtml(nextContent).substring(0, 100);
			headings.push({
				id: slugify(headingText),
				text: headingText,
				context: context,
				page: page,
				pagePath: pagePath,
			});
		}
	}
	
	return headings;
}

export function useSearchData() {
	const nuxtApp = useNuxtApp();
	const { locale, t } = useI18n();
	const localePath = useLocalePath();
	
	const isOwner = computed(() => import.meta.client ? nuxtApp.$isOwner : false);
	const isReader = computed(() => import.meta.client ? nuxtApp.$isReader : false);
	const canAccessDocuments = computed(() => isOwner.value || isReader.value);

	watch(locale, (newLocale) => {
		if (loadedLocale.value && loadedLocale.value !== newLocale) {
			isLoaded.value = false;
			headingsCache.value = [];
			featuresCache.value = [];
			timelineCache.value = [];
			documentsCache.value = [];
		}
	});

	const loadAllData = async () => {
		if (isLoading.value || (isLoaded.value && loadedLocale.value === locale.value)) return;

		isLoading.value = true;
		try {
			const allHeadings: StoredHeading[] = [];
			const allFeatures: StoredFeature[] = [];
			const allTimeline: StoredTimeline[] = [];

			const currentLocale = locale.value;

			const [
				orgData,
				homeFeaturesData,
				homeTimelineData,
				homeMiteinanderData,
				aboutTimelineData,
				aboutIntroData,
				aboutCommunityData,
				travelLageData,
				travelAutoData,
				travelZugData,
				travelFlugzeugData,
				travelFreizeitData,
				travelMaerkteData,
				travelEinkaufData,
				travelAusfluegeData,
			] = await Promise.all([
				$fetch<any>(`/api/content/organisatorisches?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-features?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-timeline?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/index-miteinander?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-timeline?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-intro?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/about-community?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-lage?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-auto?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-zug?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-flugzeug?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-freizeit?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-maerkte?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-einkauf?locale=${currentLocale}`).catch(() => null),
				$fetch<any>(`/api/content/travel-ausfluege?locale=${currentLocale}`).catch(() => null),
			]);

			const organisatorischesName = t("nav.organisatorisches");
			const homeName = t("nav.home");
			const aboutName = t("nav.about");
			const travelName = t("nav.travel");

			if (orgData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(orgData.content, organisatorischesName, "/organisatorisches"));
			}

			if (homeMiteinanderData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(homeMiteinanderData.content, homeName, "/"));
			}

			if (aboutIntroData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(aboutIntroData.content, aboutName, "/about"));
			}

			if (aboutCommunityData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(aboutCommunityData.content, aboutName, "/about"));
			}

			if (travelLageData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelLageData.content, travelName, "/travel"));
			}

			if (travelAutoData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelAutoData.content, travelName, "/travel#mit-dem-auto"));
			}

			if (travelZugData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelZugData.content, travelName, "/travel#mit-dem-zug"));
			}

			if (travelFlugzeugData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelFlugzeugData.content, travelName, "/travel#mit-dem-flugzeug"));
			}

			if (travelFreizeitData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelFreizeitData.content, travelName, "/travel#freizeit"));
			}

			if (travelMaerkteData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelMaerkteData.content, travelName, "/travel#maerkte"));
			}

			if (travelEinkaufData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelEinkaufData.content, travelName, "/travel#einkauf"));
			}

			if (travelAusfluegeData?.content) {
				allHeadings.push(...extractHeadingsFromHtml(travelAusfluegeData.content, travelName, "/travel#ausfluege"));
			}

			if (homeFeaturesData?.content) {
				try {
					const features = JSON.parse(homeFeaturesData.content);
					if (Array.isArray(features)) {
						features.forEach((f: any, i: number) => {
							if (f.title) {
								allFeatures.push({
									id: `feature-${i}`,
									title: f.title,
									description: f.description || "",
								});
							}
						});
					}
				} catch {}
			}

			if (homeTimelineData?.content) {
				try {
					const timeline = JSON.parse(homeTimelineData.content);
					if (Array.isArray(timeline)) {
						timeline.forEach((t: any, i: number) => {
							if (t.title) {
								allTimeline.push({
									id: `timeline-${i}`,
									title: t.title,
									description: t.description || "",
									date: t.date || "",
								});
							}
						});
					}
				} catch {}
			}

			if (aboutTimelineData?.content) {
				try {
					const timeline = JSON.parse(aboutTimelineData.content);
					if (Array.isArray(timeline)) {
						timeline.forEach((t: any, i: number) => {
							if (t.title) {
								allTimeline.push({
									id: `about-timeline-${i}`,
									title: t.title,
									description: t.description || "",
									date: t.date || "",
								});
							}
						});
					}
				} catch {}
			}

			headingsCache.value = allHeadings;
			featuresCache.value = allFeatures;
			timelineCache.value = allTimeline;
			loadedLocale.value = currentLocale;
			isLoaded.value = true;
		} catch (error) {
			console.error("Failed to load search data:", error);
		} finally {
			isLoading.value = false;
		}
	};

	const loadDocuments = async () => {
		if (!canAccessDocuments.value) return;

		try {
			const { $auth } = useNuxtApp();
			const user = $auth.currentUser;
			if (!user) return;

			const idToken = await user.getIdToken();
			const response = await $fetch<{ files: any[] }>("/api/files", {
				method: "POST",
				body: { limit: 500 },
				headers: { Authorization: `Bearer ${idToken}` },
			});

			if (response?.files) {
				documentsCache.value = response.files
					.filter((f: any) => !f.deletedAt)
					.map((f: any) => ({
						id: f.id,
						name: f.name,
						type: f.type,
						description: f.name,
					}));
			}
		} catch (error) {
			console.error("Failed to load documents:", error);
		}
	};

	const searchAll = (query: string): SearchResult[] => {
		if (!query.trim() || !isLoaded.value) return [];

		const searchTerms = query.toLowerCase().trim().split(/\s+/);
		const results: SearchResult[] = [];

		const matchesQuery = (text: string) => 
			searchTerms.every(term => text.toLowerCase().includes(term));

		for (const h of headingsCache.value) {
			if (matchesQuery(h.text) || matchesQuery(h.context)) {
				results.push({
					id: h.id,
					label: h.text,
					context: h.context.substring(0, 80),
					to: `${h.pagePath}#${h.id}`,
					icon: "i-lucide-heading",
					type: "heading",
				});
			}
		}

		for (const f of featuresCache.value) {
			if (matchesQuery(f.title) || matchesQuery(f.description)) {
				results.push({
					id: f.id,
					label: f.title,
					context: f.description.substring(0, 80),
					to: "/#features",
					icon: "i-lucide-star",
					type: "feature",
				});
			}
		}

		for (const t of timelineCache.value) {
			if (matchesQuery(t.title) || matchesQuery(t.description) || matchesQuery(t.date)) {
				results.push({
					id: t.id,
					label: t.title,
					context: t.description.substring(0, 80),
					to: "/#geschichte",
					icon: "i-lucide-clock",
					type: "timeline",
				});
			}
		}

		if (canAccessDocuments.value) {
			for (const d of documentsCache.value) {
				if (matchesQuery(d.name)) {
					const typeStr = d.type || "";
					const typeParts = typeStr.split("/");
					const typeLabel = typeParts[1] ? typeParts[1].toUpperCase() : "Datei";
					results.push({
						id: d.id,
						label: d.name,
						context: typeLabel,
						to: "/documents",
						icon: typeStr.startsWith("image/") ? "i-lucide-image" : 
							  typeStr.includes("pdf") ? "i-lucide-file-text" : 
							  "i-lucide-file",
						type: "document",
					});
				}
			}
		}

		return results.slice(0, 20);
	};

	return {
		isLoading: readonly(isLoading),
		isLoaded: readonly(isLoaded),
		loadAllData,
		loadDocuments,
		searchAll,
		canAccessDocuments,
	};
}
