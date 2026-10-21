export type DocumentDeleteBlockReason = "forbidden" | "not-own" | "foreign-content";

const REASON_KEYS: Record<DocumentDeleteBlockReason, string> = {
	"forbidden": "documents.errors.deleteForbidden",
	"not-own": "documents.errors.deleteNotOwn",
	"foreign-content": "documents.errors.deleteForeignContent",
};

function statusOf(error: Record<string, unknown>): number | undefined {
	const response = error.response as { status?: unknown } | undefined;
	const candidates = [error.statusCode, error.status, response?.status];
	const status = candidates.find((value) => typeof value === "number");
	return status as number | undefined;
}

/** The reason a delete was refused with 403 (issue #35), or null for other errors. */
export function documentDeleteBlockReason(error: unknown): DocumentDeleteBlockReason | null {
	if (typeof error !== "object" || error === null) return null;
	const err = error as Record<string, unknown>;
	if (statusOf(err) !== 403) return null;
	const body = err.data as { data?: { reason?: unknown }; reason?: unknown } | undefined;
	const reason = body?.data?.reason ?? body?.reason;
	if (reason === "not-own" || reason === "foreign-content" || reason === "forbidden") return reason;
	return "forbidden";
}

/** i18n key for a refused delete, or null when the error is not a 403. */
export function documentDeleteErrorKey(error: unknown): string | null {
	const reason = documentDeleteBlockReason(error);
	return reason ? REASON_KEYS[reason] : null;
}
