/**
 * Firebase authentication helpers for tests
 * Manages the global Firebase mock state for consistent test behavior
 */

/**
 * Sets the current Firebase user and claims in the global mock
 */
export function setFirebaseUser(user: any | null, claims: Record<string, boolean> = {}): void {
	const globalAny = global as any;
	
	if (!user) {
		globalAny.__FIREBASE_MOCK__ = {
			user: null,
			claims: {},
		};
		return;
	}
	
	globalAny.__FIREBASE_MOCK__ = {
		user: {
			uid: user.uid,
			email: user.email,
			displayName: user.displayName,
			photoURL: user.photoURL,
			emailVerified: user.emailVerified ?? true,
			metadata: (user as any).metadata,
			providerData: (user as any).providerData,
			...user,
		},
		claims: {
			admin: false,
			publisher: false,
			owner: false,
			reader: true,
			...claims,
		},
	};
}

/**
 * Mocks an authenticated admin user
 */
export function mockAdminUser(): void {
	setFirebaseUser({
		uid: "admin-test-uid-123",
		email: "admin@beausoleil.test",
		password: "AdminPass123!",
		displayName: "Admin User",
		photoURL: null,
		emailVerified: true,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {
		admin: true,
		publisher: false,
		owner: false,
		reader: true,
	});
}

/**
 * Mocks an authenticated publisher user
 */
export function mockPublisherUser(): void {
	setFirebaseUser({
		uid: "publisher-test-uid-456",
		email: "publisher@beausoleil.test",
		password: "PublisherPass123!",
		displayName: "Publisher User",
		photoURL: null,
		emailVerified: true,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {
		admin: false,
		publisher: true,
		owner: false,
		reader: true,
	});
}

/**
 * Mocks an authenticated owner user
 */
export function mockOwnerUser(): void {
	setFirebaseUser({
		uid: "owner-test-uid-789",
		email: "owner@beausoleil.test",
		password: "OwnerPass123!",
		displayName: "Owner User",
		photoURL: null,
		emailVerified: true,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {
		admin: false,
		publisher: false,
		owner: true,
		reader: true,
	});
}

/**
 * Mocks an authenticated reader user
 */
export function mockReaderUser(): void {
	setFirebaseUser({
		uid: "reader-test-uid-abc",
		email: "reader@beausoleil.test",
		password: "ReaderPass123!",
		displayName: "Reader User",
		photoURL: null,
		emailVerified: true,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {
		admin: false,
		publisher: false,
		owner: false,
		reader: true,
	});
}

/**
 * Mocks a regular authenticated user
 */
export function mockRegularUser(): void {
	setFirebaseUser({
		uid: "user-test-uid-def",
		email: "user@beausoleil.test",
		password: "UserPass123!",
		displayName: "Test User",
		photoURL: null,
		emailVerified: true,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {
		reader: true,
	});
}

/**
 * Mocks an unverified user (email not verified)
 */
export function mockUnverifiedUser(): void {
	setFirebaseUser({
		uid: "unverified-uid-xyz",
		email: "unverified@beausoleil.test",
		password: "UnverifiedPass123!",
		displayName: "Unverified User",
		photoURL: null,
		emailVerified: false,
		metadata: {
			creationTime: "2024-01-01T00:00:00Z",
			lastSignInTime: "2024-01-28T00:00:00Z",
		},
	}, {});
}

/**
 * Mocks an unauthenticated user (logged out)
 */
export function mockLoggedOutUser(): void {
	setFirebaseUser(null, {});
}

/**
 * Clears all Firebase mock state
 */
export function clearFirebaseMock(): void {
	const globalAny = global as any;
	globalAny.__FIREBASE_MOCK__ = {
		user: null,
		claims: {},
	};
}

/**
 * Gets the current Firebase mock state
 */
export function getFirebaseMock() {
	return (global as any).__FIREBASE_MOCK__ || { user: null, claims: {} };
}

/**
 * Helper to check if user has a specific role
 */
export function hasRole(role: string): boolean {
	return !!getFirebaseMock().claims[role];
}