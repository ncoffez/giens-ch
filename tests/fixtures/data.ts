export const testUsers = {
	admin: {
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
		customClaims: {
			admin: true,
			publisher: false,
			owner: false,
			reader: false,
		},
	},
	publisher: {
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
		customClaims: {
			admin: false,
			publisher: true,
			owner: false,
			reader: true,
		},
	},
	owner: {
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
		customClaims: {
			admin: false,
			publisher: false,
			owner: true,
			reader: true,
		},
	},
	reader: {
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
		customClaims: {
			admin: false,
			publisher: false,
			owner: false,
			reader: true,
		},
	},
	unverified: {
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
		customClaims: {},
	},
	regular: {
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
		customClaims: {
			reader: true,
		},
	},
};

export const mockLabels = [
	{
		id: "events",
		name: "Events",
		private: false,
	},
	{
		id: "markt",
		name: "Markt",
		private: false,
	},
	{
		id: "eigentuemerversammlung",
		name: "Eigentümerversammlung",
		private: true,
	},
	{
		id: "internal",
		name: "Intern",
		private: true,
	},
];

export const mockApiResponses = {
	labels: mockLabels,
};

export const mockErrors = {
	auth: {
		userNotFound: {
			code: "auth/user-not-found",
			message: "Benutzer nicht gefunden",
			statusCode: 400,
		},
		invalidCredential: {
			code: "auth/invalid-credential",
			message: "Ungültige Anmeldedaten",
			statusCode: 400,
		},
	},
	api: {
		unauthorized: {
			statusCode: 401,
			message: "Nicht authentifiziert",
		},
		forbidden: {
			statusCode: 403,
			message: "Zugriff verweigert: Fehlende Berechtigungen",
		},
		notFound: {
			statusCode: 404,
			message: "Ressource nicht gefunden",
		},
		validation: {
			statusCode: 400,
			message: "Ungültige Eingabe",
		},
		server: {
			statusCode: 500,
			message: "Serverfehler",
		},
	},
};