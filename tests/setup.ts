import { vi } from "vitest";

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
		verifyIdToken: vi.fn(() => Promise.resolve({ admin: true })),
		listUsers: vi.fn(() => Promise.resolve({ users: [] })),
	})),
}));
