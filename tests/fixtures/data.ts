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

export const mockArticles = {
	public: [
		{
			id: "article-1",
			title: "Sommerfest 2025",
			intro: "Wir feiern in der Siedlung",
			published: new Date().toISOString(),
			tags: ["events"],
			author: "Nicolas Coffez",
			authorUid: "admin-test-uid-123",
			image: "/giens/garten.webp",
			body: "<p>Detaillierte Beschreibung des Sommerfests...</p>",
		},
		{
			id: "article-2",
			title: "Marktbericht",
			intro: "Frisches Gemüse am Hafen",
			published: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
			tags: ["markt"],
			author: "Tom Bombadil",
			authorUid: "publisher-test-uid-456",
			image: "/giens/markt.jpg",
			body: "<p>Marktbericht und Zeiten...</p>",
		},
		{
			id: "article-3",
			title: "Protokoll EV",
			intro: "Ergebnisse der Versammlung",
			published: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
			tags: ["eigentuemerversammlung"],
			author: "Nicolas Coffez",
			authorUid: "admin-test-uid-123",
			image: "/placeholder/beaufs-documents.jpg",
			body: "<p>Protokoll Inhalte...</p>",
		},
	],
	private: [
		{
			id: "article-4",
			title: "Nur für Bewohner",
			intro: "Interne Informationen",
			published: new Date().toISOString(),
			tags: ["internal"],
			author: "Admin User",
			authorUid: "admin-test-uid-123",
			image: "/giens/garten.webp",
			body: "<p>Interne Inhalte...</p>",
		},
	],
	empty: [],
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
	news: {
		success: [
			{
				id: "1",
				title: "News 1",
				intro: "Intro 1",
				published: new Date().toISOString(),
				tags: ["events"],
				author: "User 1",
				authorUid: "uid-1",
				image: "/img1.jpg",
				body: "<p>Body 1</p>",
			},
			{
				id: "2",
				title: "News 2",
				intro: "Intro 2",
				published: new Date().toISOString(),
				tags: ["markt"],
				author: "User 2",
				authorUid: "uid-2",
				image: "/img2.jpg",
				body: "<p>Body 2</p>",
			},
			{
				id: "3",
				title: "News 3",
				intro: "Intro 3",
				published: new Date().toISOString(),
				tags: ["events"],
				author: "User 1",
				authorUid: "uid-1",
				image: "/img3.jpg",
				body: "<p>Body 3</p>",
			},
		],
		empty: [],
	},
	labels: mockLabels,
	article: {
		success: {
			id: "article-1",
			title: "Test Article",
			intro: "Test article introduction",
			published: new Date().toISOString(),
			tags: ["events"],
			author: "Test Author",
			authorUid: "admin-test-uid-123",
			image: "/test.jpg",
			body: "<p>Article body content</p>",
		},
	},
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