import { auth, db } from "../../useFirebaseAdmin";
import { getUserClaims } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const params = event.context.params as { uid?: string };
	const uidRaw = params?.uid;
	if (!uidRaw) {
		throw createError({ statusCode: 400, message: "Missing UID" });
	}
	const uid = uidRaw;

	const claims = await getUserClaims(event);
	const isOwner = claims?.uid === uid;
	const isAdmin = claims?.admin === true;
	const canAccessPrivate = isOwner || isAdmin;

	let userData: any = {
		displayName: "Unbekannter Bewohner",
		uid
	};

	try {
		const user = await auth.getUser(uid);
		
		// Priority: Check storage for custom upload first
		const { storage } = await import("../../useFirebaseAdmin");
		const bucket = storage.bucket();
		const prefix = `profile-pictures/${uid}/`;
		const [files] = await bucket.getFiles({ prefix });
		
		let finalPhotoURL = user.photoURL;
		if (files.length > 0) {
			const sorted = files.sort((a, b) => 
				new Date(b.metadata.timeCreated || 0).getTime() - 
				new Date(a.metadata.timeCreated || 0).getTime()
			);
			const latestFile = sorted[0];
			if (latestFile) {
				finalPhotoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(latestFile.name)}?alt=media`;
				console.log(`[Profile API] Using storage photo for ${uid}: ${latestFile.name}`);
			}
		}

		userData = {
			displayName: user.displayName || "Unbekannter Bewohner",
			photoURL: finalPhotoURL,
			uid,
			email: canAccessPrivate ? user.email : undefined,
			emailVerified: canAccessPrivate ? user.emailVerified : undefined,
			metadata: canAccessPrivate ? user.metadata : undefined
		};
	} catch (e: any) {
		const articlesByUid = await db.collection("articles")
			.where("authorUid", "==", uid)
			.limit(1)
			.get();

		if (articlesByUid.empty) {
			const articlesByName = await db.collection("articles")
				.where("author", "==", uid)
				.limit(1)
				.get();

			if (articlesByName.empty) {
				throw createError({ statusCode: 404, message: "User not found" });
			}

			const doc = articlesByName.docs[0];
			if (doc) {
				userData.displayName = doc.data().author || uid;
			} else {
				userData.displayName = uid;
			}
		} else {
			const doc = articlesByUid.docs[0];
			if (doc) {
				userData.displayName = doc.data().author || uid;
			} else {
				userData.displayName = uid;
			}
		}
	}

	try {
		console.log(`[Profile API] Fetching articles for UID: ${uid} (Private: ${canAccessPrivate})`);
		const articlesSnapshot = await db.collection("articles")
			.where("authorUid", "==", uid)
			.limit(100)
			.get();

		let articles: any[] = [];
		articlesSnapshot.forEach(doc => {
			const article = { id: doc.id, ...doc.data() };
			if (canAccessPrivate) {
				articles.push(article);
			} else {
				const { body, ...articleWithoutBody } = article as any;
				articles.push(articleWithoutBody);
			}
		});

		if (articles.length === 0) {
			const articlesByName = await db.collection("articles")
				.where("author", "==", userData.displayName)
				.limit(100)
				.get();

			articlesByName.forEach(doc => {
				const docId = doc.id;
				if (!articles.find((a: { id: string; }) => a.id === docId)) {
					const article = { id: doc.id, ...doc.data() };
					if (canAccessPrivate) {
						articles.push(article);
					} else {
						const { body, ...articleWithoutBody } = article as any;
						articles.push(articleWithoutBody);
					}
				}
			});
		}

		articles.sort((a, b) => {
			const dateA = new Date(a.published).getTime();
			const dateB = new Date(b.published).getTime();
			return dateB - dateA;
		});

		console.log(`[Profile API] Returning ${articles.length} articles for: ${userData.displayName}`);

		return {
			...userData,
			articles: articles.slice(0, 20),
			isOwner,
			isAdmin
		};
	} catch (e: any) {
		console.error("Profile API Error:", e);
		throw createError({ statusCode: 500, message: "Error fetching user articles: " + e.message });
	}
});
