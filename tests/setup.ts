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
process.env.FIREBASE_ADMIN_KEY = JSON.stringify({
	project_id: "test-project",
	client_email: "test@example.com",
	private_key: "-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----\\n",
});

// Global mock state
(global as any).__FIREBASE_MOCK__ = {
	user: null,
	claims: {}
};

// Mock i18n
const translations: Record<string, string> = {
	"hero.welcome.title": "Willkommen im Beausoleil",
	"hero.welcome.subtitle": "Ihre Oase auf der Halbinsel Giens – seit über 30 Jahren.",
	"hero.travel.title": "Anreise nach Giens",
	"hero.travel.subtitle": "Tipps für eine entspannte Reise in den Süden.",
	"hero.entdecken.title": "Entdecken",
	"hero.entdecken.subtitle": "Märkte, Ausflüge und praktische Tipps rund um Giens.",
	"home.hero.kicker": "Ankommen und aufatmen",
	"home.hero.lead": "Mediterrane Ruhe, kurze Wege zum Meer und eine kleine Gemeinschaft, die ihre Résidence mit Sorgfalt pflegt.",
	"home.hero.leads.1": "Licht, Garten und kurze Wege zum Meer. Ein Ort, der leise entschleunigt.",
	"home.hero.leads.2": "Zwischen Pinien, Salzluft und Gemeinschaft entsteht hier eine besondere Form von Sommerruhe.",
	"home.hero.stats.houses": "Häuser",
	"home.hero.stats.minutes": "Min. zum Strand",
	"home.hero.stats.region": "Côte d'Azur",
	"home.features.subtitle": "Was uns auszeichnet",
	"home.features.title": "Wohlfühlen und Erleben",
	"home.miteinander.subtitle": "Gemeinschaft",
	"home.miteinander.title": "Miteinander Gestalten",
	"home.timeline.subtitle": "Geschichte",
	"home.timeline.title": "Unsere Geschichte",
	"home.impressions.subtitle": "Impressionen",
	"home.impressions.title": "Die Schönheit von Giens",
	"home.organisatorisches.title": "Organisatorisches",
	"home.organisatorisches.subtitle": "Wichtige Informationen zur Résidence",
	"editor.edit": "Bearbeiten",
	"editor.save": "Speichern",
	"editor.cancel": "Abbrechen",
	"nav.home": "Home",
	"nav.travel": "Anreise",
	"nav.entdecken": "Entdecken",
	"nav.organisatorisches": "Organisatorisches",
	"nav.documents": "Dokumente",
	"nav.profile": "Profil",
	"nav.myHomes": "Meine Häuser",
	"nav.admin": "Verwaltung",
	"nav.login": "Anmelden",
	"nav.logout": "Abmelden",
	"nav.menu": "Menü",
	"nav.search": "Suchen",
	"mobileMenu.title": "Menü",
	"mobileMenu.description": "Navigation und Suche",
	"mobileMenu.openLabel": "Menü öffnen",
	"mobileMenu.searchPlaceholder": "Suchen oder navigieren...",
	"mobileMenu.searching": "Suche läuft...",
	"mobileMenu.noResults": "Keine Treffer gefunden.",
	"mobileMenu.sections.admin": "Verwaltung",
	"admin.nav.homes": "Häuser",
	"admin.nav.users": "Benutzer",
	"admin.nav.labels": "Labels",
	"admin.nav.trash": "Papierkorb",
	"admin.nav.settings": "Einstellungen",
	"admin.nav.back": "Zurück zur Seite",
	"admin.layout.kicker": "Kontrollzentrum",
	"admin.layout.title": "Administration",
	"admin.layout.lead": "Benutzer, Häuser, Sichtbarkeit und interne Abläufe an einem Ort.",
	"search.sections.pages": "Schnellzugriff",
	"search.sections.headings": "Überschriften",
	"search.sections.information": "Informationen",
	"search.sections.documents": "Dokumente",
	"footer.copyright": "© {year} Résidence Beausoleil, Giens",
	"stats.editStats": "Statistiken bearbeiten",
	"travel.intro.kicker": "Schnell orientiert",
	"travel.intro.lead": "Ob mit Auto, Zug oder Flug: Giens ist gut erreichbar, wenn man die letzte Etappe sauber plant.",
	"travel.intro.body": "Diese Seite bündelt die Wege, die sich für Eigentümer und Gäste in der Praxis bewährt haben.",
	"travel.intro.factsTitle": "Auf einen Blick",
	"travel.intro.pillars.drive.title": "Mit dem Auto",
	"travel.intro.pillars.drive.description": "Die flexibelste Variante für Familien, längere Aufenthalte und viel Gepäck.",
	"travel.intro.pillars.train.title": "Mit dem Zug",
	"travel.intro.pillars.train.description": "Entspannt bis Hyères reisen und die letzte Etappe mit Bus oder Taxi ergänzen.",
	"travel.intro.pillars.flight.title": "Mit dem Flugzeug",
	"travel.intro.pillars.flight.description": "Schnell im Süden, besonders praktisch für Kurzaufenthalte oder spontane Reisen.",
	"travel.intro.facts.distance": "ab Bern",
	"travel.intro.facts.drive": "mit dem Auto",
	"travel.intro.facts.airport": "bis TLN",
	"travel.locationFacts.walk.label": "Zu Fuss",
	"travel.locationFacts.walk.value": "ca. 15 Min. zum Strand",
	"travel.locationFacts.port.label": "Fähre",
	"travel.locationFacts.port.value": "rund 1 km bis La Tour Fondue",
	"travel.locationFacts.nature.label": "Umgebung",
	"travel.locationFacts.nature.value": "direkt an geschützten Naturzonen",
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
	getApps: vi.fn(() => []),
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
	getApp: vi.fn(() => ({})),
	getApps: vi.fn(() => []),
	cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
	FieldValue: {
		increment: vi.fn((value: number) => ({ __increment__: value })),
	},
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

vi.mock("firebase-admin/storage", () => ({
	getStorage: vi.fn(() => ({
		bucket: vi.fn(() => ({
			file: vi.fn(() => ({
				exists: vi.fn(() => Promise.resolve([false])),
				getSignedUrl: vi.fn(() => Promise.resolve(["https://example.com/file"])),
			})),
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
