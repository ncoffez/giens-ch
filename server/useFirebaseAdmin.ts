import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

const config = useRuntimeConfig();

admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(config.FIREBASE_ADMIN_KEY)),
});

export const auth = getAuth();