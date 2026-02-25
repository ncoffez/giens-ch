import admin from "firebase-admin";
import { db, auth } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	const health = {
		timestamp: new Date().toISOString(),
		firebaseAdminInitialized: false,
		projectId: "",
		authenticatedUser: null as { uid: string; email: string } | null,
		testQuerySuccessful: false,
		errors: [] as string[]
	};

	try {
		// Check Firebase Admin initialization
		const adminApp = admin.app();
		health.firebaseAdminInitialized = !!adminApp;

		try {
			health.projectId = adminApp.options.projectId || "";
			console.log('[Health Check] Firebase Admin initialized:', health.firebaseAdminInitialized);
			console.log('[Health Check] Project ID:', health.projectId);
		} catch (e: unknown) {
			health.errors.push(`Failed to get project ID: ${e?.message || 'Unknown error'}`);
		}

		// Try to get current authenticated user (if any)
		try {
			const authHeader = getHeader(event, "Authorization");
			if (authHeader?.startsWith("Bearer ")) {
				const token = authHeader.split(" ")[1];
				if (token) {
					const decodedToken = await auth.verifyIdToken(token);
					health.authenticatedUser = {
						uid: decodedToken.uid,
						email: decodedToken.email || ""
					};
					console.log('[Health Check] Authenticated user:', health.authenticatedUser.uid);
				}
			}
		} catch (e) {
			console.log('[Health Check] No authenticated user or token verification failed');
		}

		// Test database query
		try {
			const sampleQuery = await db.collection("articles").limit(1).get();
			health.testQuerySuccessful = true;
			console.log('[Health Check] Database query successful, found:', sampleQuery.size, 'articles');
		} catch (e: unknown) {
			health.errors.push(`Database query failed: ${e?.message || 'Unknown error'}`);
		}

		return health;
	} catch (e: unknown) {
		health.errors.push(e?.message || "Unknown error");
		console.error('[Health Check] Fatal error:', health.errors);
		throw createError({
			statusCode: 500,
			message: "Health check failed"
		});
	}
});