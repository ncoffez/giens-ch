import { auth, storage } from "../../useFirebaseAdmin";

export default defineEventHandler(async (event) => {
	try {
		const idToken = event.headers.get("authorization")?.split("Bearer ")[1];
		if (!idToken) {
			throw createError({ statusCode: 401, message: "Unauthorized" });
		}

		const decodedToken = await auth.verifyIdToken(idToken);
		const uid = decodedToken.uid;

		const bucket = storage.bucket();
		const prefix = `profile-pictures/${uid}/`;

		const [files] = await bucket.getFiles({ prefix });

		const pictures = files
			.map((file) => ({
				name: file.name,
				url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`,
				timeCreated: file.metadata?.timeCreated || new Date().toISOString(),
				size: file.metadata?.size || 0,
			}))
			.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime())
			.slice(0, 10);

		return { pictures };
	} catch (e: any) {
		console.error("[Pictures Get API Error]:", e);
		throw createError({
			statusCode: e.statusCode || 500,
			message: e.message || "Failed to load profile pictures",
		});
	}
});