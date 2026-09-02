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
	visibility?: "shared" | "private";
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
	searchUpdatedAt?: string;
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
	privateFiles?: HomeFile[];
	folders: HomeFolder[];
	wifiSSID?: string;
	wifiPassword?: string;
	/** The source-language text; mirrors instructionsByLocale[instructionsSourceLocale]. */
	instructions?: string;
	/** Which language the owner writes the Anleitung in ("de" or "fr"). */
	instructionsSourceLocale?: "de" | "fr";
	/** The Anleitung per locale: the source text plus its counterpart. */
	instructionsByLocale?: Partial<Record<"de" | "fr", string>>;
	/** Per locale: whether the text is machine-generated and what it was made from. */
	instructionsMeta?: Partial<Record<"de" | "fr", {
		auto: boolean;
		sourceHash?: string;
		translatedAt?: string;
	}>>;
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
	deletedByLabel?: string;
	searchText?: string;
	searchSummary?: string;
	searchKeywords?: string[];
	searchUpdatedAt?: string;
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

export interface MarketItem {
	dayKey: string;
	label: string;
	description: string;
}

export interface JourneyStep {
	eyebrow?: string;
	title: string;
	detail: string;
}
