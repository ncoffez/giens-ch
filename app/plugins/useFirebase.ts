import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { useLocalStorage } from "@vueuse/core";

export default defineNuxtPlugin((_nuxtApp) => {
	const config = useRuntimeConfig();
	let firebaseConfig = {};

	firebaseConfig = JSON.parse(config.public.FIREBASE_FRONTEND_KEY);
	const app = initializeApp(firebaseConfig);

	const db = getFirestore(app);
	const auth = getAuth();
	const functions = getFunctions(app, "europe-west6");

	const user = useLocalStorage("user", null, {
		serializer: {
			read: (v) => (v ? JSON.parse(v) : null),
			write: (v) => JSON.stringify(v),
		},
	});
	const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
		user.value = currentUser;
	});
	const userPermission = computed(() => (user.value ? "private" : "public"));
	return {
		provide: { db, auth, functions, currentUser: user, unsubscribe, userPermission },
	};
});
