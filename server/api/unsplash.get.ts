import type { UnsplashImage } from "../../types";

interface UnsplashApiResult {
	id: string;
	urls: {
		regular: string;
		thumb: string;
		full: string;
	};
	description: string | null;
	alt_description: string | null;
	user: {
		name: string;
		links: {
			html: string;
		};
	};
}

interface UnsplashApiResponse {
	results: UnsplashApiResult[];
	total: number;
	total_pages: number;
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const searchQuery = query.q as string || "nature";
	const page = parseInt(query.page as string) || 1;
	const perPage = 12;

	const config = useRuntimeConfig();
	const unsplashConfig = config.UNSPLASH_API_KEY ? JSON.parse(config.UNSPLASH_API_KEY) : null;
	
	if (!unsplashConfig?.accessKey) {
		throw createError({ statusCode: 500, message: "Unsplash API key not configured" });
	}

	try {
		const response = await fetch(
			`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}&orientation=landscape`,
			{
				headers: {
					Authorization: `Client-ID ${unsplashConfig.accessKey}`,
				},
			}
		);

		if (!response.ok) {
			throw createError({ statusCode: response.status, message: "Unsplash API error" });
		}

		const data: UnsplashApiResponse = await response.json();

		const images: UnsplashImage[] = data.results.map((img) => ({
			id: img.id,
			url: img.urls.regular,
			thumb: img.urls.thumb,
			description: img.description || img.alt_description || "",
			author: img.user.name,
			authorUrl: img.user.links.html,
			downloadUrl: img.urls.full,
		}));

		return {
			images,
			total: data.total,
			totalPages: data.total_pages,
			currentPage: page,
		};
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to fetch images";
		throw createError({ statusCode: 500, message });
	}
});