import crypto from "crypto";
import type { Bucket, File } from "@google-cloud/storage";

export const buildFirebaseDownloadUrl = (bucketName: string, storagePath: string, token: string) => {
	return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
};

export const ensureFirebaseDownloadToken = async (file: File) => {
	const [metadata] = await file.getMetadata();
	const existingTokens = metadata.metadata?.firebaseStorageDownloadTokens;
	const token = existingTokens?.split(",")[0] || crypto.randomUUID();

	if (!existingTokens) {
		await file.setMetadata({
			metadata: {
				...(metadata.metadata || {}),
				firebaseStorageDownloadTokens: token,
			},
		});
	}

	return token;
};

export const createTokenizedDownloadUrl = async (bucket: Bucket, storagePath: string) => {
	const file = bucket.file(storagePath);
	const token = await ensureFirebaseDownloadToken(file);
	return buildFirebaseDownloadUrl(bucket.name, storagePath, token);
};
