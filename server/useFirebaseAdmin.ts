import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const config = useRuntimeConfig();

const serviceAccount = JSON.parse(config.FIREBASE_ADMIN_KEY);

// Use a more robust bucket detection
const bucketName = process.env.STORAGE_BUCKET || 
				   `${serviceAccount.project_id}.firebasestorage.app`;

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		storageBucket: bucketName
	});
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = admin.storage();
