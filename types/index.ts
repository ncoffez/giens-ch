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

export interface HomeContact {
	phone?: string;
	email?: string;
	name?: string;
}

export interface Home {
	id: string;
	name: string;
	slug: string;
	ownerIds: string[];
	editors: string[];
	photos: string[];
	enabled: boolean;
	contact: HomeContact;
	wifiPassword?: string;
	checkInInfo: string;
	checkOutInfo: string;
	mustKnows: string[];
	houseRules: string;
	blanketsInfo: string;
	cleaningInfo: string[];
	parkingNumber?: string;
	washingMachineOverride?: string;
	createdAt: string;
	updatedAt: string;
}

export interface HomeShare {
	id: string;
	homeId: string;
	createdBy: string;
	expiresAt: string;
	accessCount: number;
	createdAt: string;
}

export interface GlobalSettings {
	id: string;
	maxHomeNumber: number;
	washingMachineUse: string;
	updatedAt: string;
}