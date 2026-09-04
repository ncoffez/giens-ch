interface AccessClaims {
	uid?: string;
	admin?: boolean;
	publisher?: boolean;
	owner?: boolean;
	reader?: boolean;
}

interface HomeOwnerList {
	ownerIds?: string[] | null;
}

export function canReadGlobalDocuments(claims: AccessClaims | null | undefined) {
	return !!(claims && (claims.admin || claims.publisher || claims.owner || claims.reader));
}

export function canAdminGlobalDocuments(claims: AccessClaims | null | undefined) {
	return !!claims?.admin;
}

export function canManageHomeFiles(claims: AccessClaims | null | undefined, home: HomeOwnerList | null | undefined) {
	if (!claims?.uid || !home || !Array.isArray(home.ownerIds)) return false;
	return home.ownerIds.includes(claims.uid);
}
