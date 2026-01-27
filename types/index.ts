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

export interface User {
	id?: string;
	email?: string;
	displayName?: string;
	photoURL?: string;
	emailVerified?: boolean;
	uid?: string;
}

export interface AdminUser extends User {
	admin: boolean;
	publisher: boolean;
	owner: boolean;
	reader: boolean;
	disabled?: boolean;
}

export interface Label {
	id: string;
	name?: string;
	private: boolean;
}

export interface Author {
	id: string;
	name: string;
}