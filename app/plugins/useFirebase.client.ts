import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { useLocalStorage } from "@vueuse/core";

export default defineNuxtPlugin((_nuxtApp) => {
	const config = useRuntimeConfig();
	const firebaseConfig = JSON.parse(config.public.FIREBASE_FRONTEND_KEY || "{}");
	const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

	const db = getFirestore(app);
	const auth = getAuth(app);
	const functions = getFunctions(app, "europe-west6");

	const user = useLocalStorage("user", null, {
		serializer: {
			read: (v) => (v ? JSON.parse(v) : null),
			write: (v) => JSON.stringify(v),
		},
	});

	const claims = ref<Record<string, any>>({});
	const token = ref<string | null>(null);
	const authInitialized = ref(false);

	const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
		user.value = currentUser;
		if (currentUser) {
			const tokenResult = await getIdTokenResult(currentUser);
			claims.value = tokenResult.claims;
			token.value = tokenResult.token;
		} else {
			claims.value = {};
			token.value = null;
		}
		authInitialized.value = true;
	});

	const isAdmin = computed(() => !!claims.value.admin);
	const isPublisher = computed(() => !!claims.value.publisher || !!claims.value.admin);
	const isOwner = computed(() => !!claims.value.owner || !!claims.value.admin);
	const isReader = computed(() => !!claims.value.reader || !!claims.value.admin || !!claims.value.publisher || !!claims.value.owner);

	const userPermission = computed(() => {
		if (isReader.value) return "private";
		return "public";
	});

	const hasRole = (role: string) => !!claims.value[role];

	return {
		provide: { 
			db, 
			auth, 
			functions, 
			currentUser: user, 
			claims,
			token,
			isAdmin,
			isPublisher,
			isOwner,
			isReader,
			hasRole,
			authInitialized,
			unsubscribe, 
			userPermission 
		},
	};
});
