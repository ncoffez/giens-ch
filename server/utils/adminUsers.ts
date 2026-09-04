interface AuthUserLike {
	uid: string;
	email?: string;
	displayName?: string;
	photoURL?: string;
	emailVerified?: boolean;
	disabled?: boolean;
	customClaims?: Record<string, unknown>;
}

interface FirestoreUserLike {
	displayName?: string;
	photoURL?: string;
}

export function toAdminUserListItem(user: AuthUserLike, firestoreData: FirestoreUserLike = {}) {
	const claims = user.customClaims || {};
	const roles = {
		admin: !!claims.admin,
		publisher: !!claims.publisher,
		owner: !!claims.owner,
		reader: !!claims.reader,
	};

	return {
		uid: user.uid,
		email: user.email,
		displayName: firestoreData.displayName || user.displayName,
		photoURL: firestoreData.photoURL || user.photoURL,
		emailVerified: user.emailVerified,
		disabled: user.disabled,
		...roles,
		customClaims: roles,
	};
}
