export const placeholders = [
	"/giens/strand-1.webp",
	"/giens/meer-1.webp",
	"/giens/pizza.webp",
	"/giens/giens-aerial.webp",
	"/giens/garten.jpeg",
	"/giens/felsen.webp"
];

/**
 * Returns a deterministic placeholder image based on an ID.
 */
export const getArticlePlaceholder = (id: string | undefined | null) => {
	if (!id) return placeholders[0];
	
	// Simple deterministic hash based on string
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % placeholders.length;
	return placeholders[index];
};
