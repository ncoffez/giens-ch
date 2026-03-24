import { vi } from "vitest";
import { ref } from "vue";

// Polyfill localStorage for happy-dom
if (typeof window !== "undefined") {
	const storage: Record<string, string> = {};
	const mockStorage = {
		getItem: vi.fn((key: string) => storage[key] || null),
		setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
		removeItem: vi.fn((key: string) => { delete storage[key]; }),
		clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
		key: vi.fn((index: number) => Object.keys(storage)[index] || null),
		get length() { return Object.keys(storage).length; },
	};
	Object.defineProperty(window, "localStorage", { value: mockStorage, writable: true });
}

process.env.FIREBASE_FRONTEND_KEY = JSON.stringify({ apiKey: "test" });

// Global mock state
(global as any).__FIREBASE_MOCK__ = {
	user: null,
	claims: {}
};

// Mock i18n
const translations: Record<string, string> = {
	"hero.welcome.title": "Willkommen im Beausoleil",
	"hero.welcome.subtitle": "Ihre Oase auf der Halbinsel Giens – seit über 30 Jahren.",
	"hero.about.title": "Über uns",
	"hero.about.subtitle": "Eine Gemeinschaft von 20 Eigentümern auf der Halbinsel Giens.",
	"hero.travel.title": "Anreise nach Giens",
	"hero.travel.subtitle": "Tipps für eine entspannte Reise in den Süden.",
	"home.features.subtitle": "Was uns auszeichnet",
	"home.features.title": "Wohlfühlen und Erleben",
	"home.miteinander.title": "Miteinander Gestalten",
	"home.miteinander.button": "Mehr erfahren",
	"home.timeline.title": "Unsere Geschichte",
	"home.impressions.subtitle": "Impressionen",
	"home.impressions.title": "Die Schönheit von Giens",
	"home.organisatorisches.title": "Organisatorisches",
	"home.organisatorisches.subtitle": "Wichtige Informationen zur Résidence",
	"editor.edit": "Bearbeiten",
	"editor.save": "Speichern",
	"editor.cancel": "Abbrechen",
	"nav.home": "Home",
	"nav.about": "Über uns",
	"nav.travel": "Anreise",
	"nav.organisatorisches": "Organisatorisches",
	"nav.documents": "Dokumente",
	"nav.profile": "Profil",
	"nav.myHomes": "Meine Häuser",
	"nav.admin": "Verwaltung",
	"nav.login": "Anmelden",
	"nav.logout": "Abmelden",
	"footer.copyright": "© {year} Lotissement Beausoleil, Giens",
	"about.philosophy.subtitle": "Unsere Philosophie",
	"about.philosophy.title": "Miteinander Gestalten",
	"about.timeline.title": "Unsere Geschichte",
	"about.community.subtitle": "Gemeinschaft",
	"about.community.title": "Das Leben im Lotissement",
	"about.impressions.subtitle": "Impressionen",
	"about.impressions.title": "Wohlfühlmomente",
	"stats.editStats": "Statistiken bearbeiten",
	"travel.lage.subtitle": "Ihr Ziel auf der Halbinsel",
	"travel.lage.title": "Lage",
	"travel.auto.subtitle": "Ab Bern via Autobahn",
	"travel.auto.title": "Mit dem Auto",
	"travel.auto.routeButton": "Route planen & Verkehrslage",
	"travel.auto.tip": "Tipp:",
	"travel.auto.tipText": "Während der Sommerferien (Juli/August) ist die Strecke zwischen Valence und Orange oft stark befahren. Samstage sind dann besonders staubelastet.",
	"travel.auto.routeTitle": "Route auf einen Blick",
	"travel.auto.toll": "Autobahngebühren (Péage)",
	"travel.auto.tollPrice": "ca. 60 €",
	"travel.zug.subtitle": "Umweltfreundlich & entspannt",
	"travel.zug.title": "Mit dem Zug",
	"travel.zug.transfer": "Transfer ab Hyères",
	"travel.zug.transferText": "Bus Linie 67 (Richtung Giens) oder Taxi.",
	"travel.zug.busButton": "Bus Linie 67",
	"travel.flugzeug.subtitle": "Am schnellsten ans Ziel",
	"travel.flugzeug.title": "Mit dem Flugzeug",
	"travel.flugzeug.directFlights": "Direktflüge",
	"travel.flugzeug.directFlightsText": "Ab Genf / Zürich nach Marseille oder Toulon.",
	"travel.flugzeug.rentalCar": "Mietwagen",
	"travel.flugzeug.rentalCarText": "Direkt an allen Flughäfen verfügbar.",
	"travel.quickLinks.auto": "Mit dem Auto",
	"travel.quickLinks.zug": "Mit dem Zug",
	"travel.quickLinks.flugzeug": "Mit dem Flugzeug",
};

const createMockI18n = () => ({
	t: (key: string, params?: Record<string, any>) => {
		let text = translations[key] || key;
		if (params) {
			Object.entries(params).forEach(([k, v]) => {
				text = text.replace(`{${k}}`, String(v));
			});
		}
		return text;
	},
	locale: ref("de"),
	locales: ref([
		{ code: "de", language: "de-CH", name: "Deutsch", file: "de.json" },
		{ code: "fr", language: "fr-CH", name: "Français", file: "fr.json" },
	]),
	setLocale: vi.fn(),
});

vi.mock("#imports", () => ({
	useI18n: createMockI18n,
}));

vi.mock("#build/i18n.options.mjs", () => ({
	useI18n: createMockI18n,
}));

vi.mock("@nuxtjs/i18n", () => ({
	useI18n: createMockI18n,
}));

// Mock Firebase (Client-side)
vi.mock("firebase/app", () => ({
	initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
	getAuth: vi.fn(() => ({})),
	onAuthStateChanged: vi.fn((auth, cb) => {
		cb((global as any).__FIREBASE_MOCK__.user);
		return vi.fn();
	}),
	getIdTokenResult: vi.fn(() => Promise.resolve({ claims: (global as any).__FIREBASE_MOCK__.claims })),
}));

vi.mock("firebase/firestore", () => ({
	getFirestore: vi.fn(() => ({})),
}));

vi.mock("firebase/functions", () => ({
	getFunctions: vi.fn(() => ({})),
}));

// Mock Firebase Admin (Server-side)
vi.mock("firebase-admin/app", () => ({
	initializeApp: vi.fn(),
	getApp: vi.fn(),
	cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
	getFirestore: vi.fn(() => ({
		collection: vi.fn(() => ({
			get: vi.fn(() => Promise.resolve({
				forEach: vi.fn((cb) => {
					cb({
						id: "test-id",
						data: () => ({
							title: "Test Article",
							tags: ["public"],
							published: "2025-01-01",
							intro: "Test Intro",
							image: "test.jpg",
							body: "Test Body"
						})
					});
				})
			})),
			doc: vi.fn(() => ({
				get: vi.fn(() => Promise.resolve({
					exists: true,
					id: "test-id",
					data: () => ({
						title: "Test Article",
						tags: ["public"],
						published: "2025-01-01",
						intro: "Test Intro",
						image: "test.jpg",
						body: "Test Body"
					})
				}))
			}))
		})),
	})),
}));

vi.mock("firebase-admin/auth", () => ({
	getAuth: vi.fn(() => ({
		verifyIdToken: vi.fn().mockImplementation((token) => {
			if (token === 'invalid') throw new Error('Invalid token');
			return Promise.resolve({ admin: true, owner: true, publisher: true });
		}),
		listUsers: vi.fn(() => Promise.resolve({ users: [] })),
	})),
}));
