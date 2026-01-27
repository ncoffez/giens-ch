export interface Article {
	id: string;
	title: string;
	intro: string;
	published: string;
	tags: string[];
	image: string;
	body: string;
	author?: string;
	authorUid?: string;
}
