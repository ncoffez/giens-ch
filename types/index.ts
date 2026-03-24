export interface User {
	id?: string;
	email?: string;
	displayName?: string;
	name?: string;
	photoURL?: string;
	emailVerified?: boolean;
	uid?: string;
	homesFeatureEnabled?: boolean;
}

export interface AdminUser extends User {
	admin: boolean;
	publisher: boolean;
	owner: boolean;
	reader: boolean;
	disabled?: boolean;
	customClaims?: {
		admin?: boolean;
		publisher?: boolean;
		owner?: boolean;
		reader?: boolean;
	};
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

export interface HomeFile {
	id: string;
	name: string;
	type: string;
	size: number;
	url: string;
	folderId: string | null;
	uploadedAt: string;
	updatedAt?: string;
	uploadedBy: string;
	lastModified?: number;
	storagePath?: string;
}

export interface HomeFolder {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
}

export interface HomeContact {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	notes?: string;
	hidden: boolean;
	isOwner: boolean;
	avatar?: string;
}

export interface Home {
	id: string;
	name: string;
	ownerIds: string[];
	photos: string[];
	files: HomeFile[];
	folders: HomeFolder[];
	wifiSSID?: string;
	wifiPassword?: string;
	instructions?: string;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	contacts?: HomeContact[];
	ownerEmail?: string;
	ownerPhone?: string;
}

export interface HomeShare {
	id: string;
	homeId: string;
	createdBy: string;
	expiresAt: string;
	revoked: boolean;
	accessCount: number;
	createdAt: string;
}

export interface GlobalSettings {
	id: string;
	maxHomeNumber: number;
	washingMachineUse: string;
	homesFeatureGloballyEnabled: boolean;
	updatedAt: string;
}

export interface GlobalFile {
	id: string;
	name: string;
	type: string;
	size: number;
	url: string;
	thumbnailUrl?: string;
	optimizedUrl?: string;
	folderId: string | null;
	uploadedAt: string;
	uploadedBy: string;
	uploadedByName?: string;
	lastModified?: number;
	storagePath?: string;
	deletedAt?: string;
	deletedBy?: string;
}

export interface GlobalFolder {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
	createdBy: string;
	createdByName?: string;
}

export interface UnsplashImage {
	id: string;
	url: string;
	thumb: string;
	description: string;
	author: string;
	authorUrl: string;
	downloadUrl: string;
}

export interface UnsplashSearchResult {
	images: UnsplashImage[];
	total: number;
	totalPages: number;
	currentPage: number;
}

export interface LocalizedContent {
	de: string;
	fr: string;
}

export interface PageContent {
	id: string;
	content: string | LocalizedContent;
	translated?: { fr?: string };
	updatedAt: string;
	updatedBy: string;
}

export interface FeatureCard {
	icon: string;
	title: string;
	description: string;
	bgColor: string;
	iconColor: string;
}

export interface StatItem {
	value: string;
	label: string;
}

export interface TimelineItem {
	date: string;
	title: string;
	description: string;
	icon: string;
}
