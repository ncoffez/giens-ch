import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const config = useRuntimeConfig();

admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(config.FIREBASE_ADMIN_KEY)),
});

export const auth = getAuth();
export const db = getFirestore();
