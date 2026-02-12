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

		const data = await response.json();

		const images = data.results.map((img: any) => ({
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
	} catch (error: any) {
		throw createError({ statusCode: 500, message: error.message || "Failed to fetch images" });
	}
});