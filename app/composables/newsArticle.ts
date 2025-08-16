export interface NewsArticle {
	id: string;
	title: string;
	content: string;
	published: string; // ISO date string
	label: string[];
	tags: string[];
	author?: string;
	intro: string;
	image: string;
	body: string;
}
