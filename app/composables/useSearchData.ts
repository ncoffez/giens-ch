interface OrganisatorischesContent {
	id: string;
	content: string;
	updatedAt: string;
	updatedBy: string;
}

interface SearchOrganisatorischesHeading {
	id: string;
	heading: string;
	context: string;
	pageLabel: string;
}

interface StoredHeading {
	id: string;
	text: string;
	context: string;
}

const organisatorischesHeadingsCache = ref<StoredHeading[]>([]);
const isLoading = ref(false);

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
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

function extractHeadings(html: string): StoredHeading[] {
	if (!html) return [];
	
	const headings: StoredHeading[] = [];
	const headingRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
	let match;
	
	while ((match = headingRegex.exec(html)) !== null) {
		const headingText = stripHtml(match[1] || "");
		if (headingText) {
			const nextContent = html.substring(match.index + match[0].length, match.index + match[0].length + 200);
			const context = stripHtml(nextContent).substring(0, 100);
			headings.push({
				id: slugify(headingText),
				text: headingText,
				context: context,
			});
		}
	}
	
	return headings;
}

export function useSearchData() {
	const loadOrganisatorisches = async () => {
		if (isLoading.value) return;

		isLoading.value = true;
		try {
			const orgData = await $fetch<OrganisatorischesContent>("/api/organisatorisches");

			if (orgData?.content) {
				organisatorischesHeadingsCache.value = extractHeadings(orgData.content);
			}
		} catch (error) {
			console.error("Failed to load search data:", error);
		} finally {
			isLoading.value = false;
		}
	};

	const searchOrganisatorischesHeadings = (query: string): SearchOrganisatorischesHeading[] => {
		if (organisatorischesHeadingsCache.value.length === 0 || !query.trim()) return [];

		const searchTerms = query.toLowerCase().trim().split(/\s+/);
		
		return organisatorischesHeadingsCache.value
			.filter(h => searchTerms.every(term => h.text.toLowerCase().includes(term)))
			.map(h => ({
				id: h.id,
				heading: h.text,
				context: h.context.substring(0, 80),
				pageLabel: "Organisatorisches",
			}));
	};

	return {
		isLoading: readonly(isLoading),
		loadOrganisatorisches,
		searchOrganisatorischesHeadings,
	};
}
