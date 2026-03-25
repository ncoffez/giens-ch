import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";

const currentUser = ref<User | null>(null);
const claims = ref<Record<string, any>>({});
const token = ref<string | null>(null);
const authInitialized = ref(false);
const isAuthInitializing = ref(false);

const isAdmin = computed(() => !!claims.value.admin);
const isPublisher = computed(() => !!claims.value.publisher || !!claims.value.admin);
const isOwner = computed(() => !!claims.value.owner || !!claims.value.admin);
const isReader = computed(() => !!claims.value.reader || !!claims.value.admin || !!claims.value.publisher || !!claims.value.owner);
const userPermission = computed(() => (isReader.value ? "private" : "public"));

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;
let firestorePromise: Promise<Firestore> | null = null;
let functionsPromise: Promise<Functions> | null = null;
let authReadyPromise: Promise<void> | null = null;

function getFirebaseConfig() {
	const config = useRuntimeConfig();
	return JSON.parse(config.public.FIREBASE_FRONTEND_KEY || "{}");
}

async function ensureFirebaseApp() {
	if (!appPromise) {
		appPromise = (async () => {
			const [{ getApps, initializeApp }] = await Promise.all([
				import("firebase/app"),
			]);
			const firebaseConfig = getFirebaseConfig();
			return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
		})();
	}

	return appPromise;
}

async function syncAuthState(user: User | null) {
	currentUser.value = user;

	if (!user) {
		claims.value = {};
		token.value = null;
		return;
	}

	try {
		const { getIdTokenResult } = await import("firebase/auth");
		const tokenResult = await getIdTokenResult(user);
		claims.value = tokenResult.claims;
		token.value = tokenResult.token;
	} catch {
		claims.value = {};
		token.value = null;
	}
}

async function ensureAuth() {
	if (!authPromise) {
		authPromise = (async () => {
			isAuthInitializing.value = true;
			const app = await ensureFirebaseApp();
			const { getAuth, onAuthStateChanged } = await import("firebase/auth");
			const auth = getAuth(app);

			if (!authReadyPromise) {
				authReadyPromise = new Promise<void>((resolve) => {
					let initialEventHandled = false;

					onAuthStateChanged(auth, async (user) => {
						await syncAuthState(user);
						authInitialized.value = true;
						if (!initialEventHandled) {
							initialEventHandled = true;
							resolve();
						}
					});
				});
			}

			await authReadyPromise;
			return auth;
		})().finally(() => {
			isAuthInitializing.value = false;
		});
	}

	return authPromise;
}

async function ensureFirestore() {
	if (!firestorePromise) {
		firestorePromise = (async () => {
			const app = await ensureFirebaseApp();
			const { getFirestore } = await import("firebase/firestore");
			return getFirestore(app);
		})();
	}

	return firestorePromise;
}

async function ensureFunctions() {
	if (!functionsPromise) {
		functionsPromise = (async () => {
			const app = await ensureFirebaseApp();
			const { getFunctions } = await import("firebase/functions");
			return getFunctions(app, "europe-west6");
		})();
	}

	return functionsPromise;
}

async function getAuthToken(forceRefresh = false) {
	const auth = await ensureAuth();
	const user = auth.currentUser;
	if (!user) {
		return null;
	}

	const nextToken = await user.getIdToken(forceRefresh);
	token.value = nextToken;
	return nextToken;
}

async function signOut() {
	const auth = await ensureAuth();
	await auth.signOut();
	await syncAuthState(null);
	authInitialized.value = true;
}

export default defineNuxtPlugin(() => {
	return {
		provide: {
			currentUser,
			claims,
			token,
			authInitialized,
			isAdmin,
			isPublisher,
			isOwner,
			isReader,
			userPermission,
			hasRole: (role: string) => !!claims.value[role],
			ensureAuth,
			ensureFirestore,
			ensureFunctions,
			getAuthToken,
			signOut,
			isAuthInitializing,
		},
	};
});
