import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const config = useRuntimeConfig();

const serviceAccount = JSON.parse(config.FIREBASE_ADMIN_KEY);

// Use a more robust bucket detection
// Defaulting to .appspot.com which is the standard for many Firebase projects, 
// and matches the configuration seen in this project's .env
const bucketName = process.env.STORAGE_BUCKET || 
				   `${serviceAccount.project_id}.appspot.com`;

const app = getApps().length ? getApp() : initializeApp({
	credential: cert(serviceAccount),
	storageBucket: bucketName
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
