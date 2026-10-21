/**
 * Uploads travel as Base64 JSON through the Nuxt server function. Base64 adds a
 * third to the size and Cloud Run (Firebase Functions gen 2) rejects requests
 * over 32 MiB, so ~24 MiB is the practical ceiling; 23 MiB leaves room for the
 * JSON wrapper. Client and server use the same number so the user gets a clear
 * message instead of an opaque 413 (issue #39).
 */
export const MAX_UPLOAD_BYTES = 23 * 1024 * 1024;

/** The editor route has always capped attachments at 20 MB. */
export const MAX_EDITOR_UPLOAD_BYTES = 20 * 1024 * 1024;

export const formatUploadLimit = (bytes: number) => `${Math.floor(bytes / (1024 * 1024))} MB`;
