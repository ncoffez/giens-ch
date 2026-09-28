import { db } from "../useFirebaseAdmin";
import {
	DOCUMENT_ACTIONS,
	EMPTY_PERMISSION_CONFIG,
	PERMISSION_ROWS,
	SITE_ROLES,
	type FolderRef,
	type PermissionAuditLine,
	type SitePermissionConfig,
	permissionAuditLines,
	resolvedGrants,
	sanitizePermissionConfig,
} from "../../shared/sitePermissions";

const CONFIG_DOC = "sitePermissions/config";
const AUDIT_LIMIT = 40;

export interface StoredPermissionAudit {
	at: string;
	uid: string;
	lines: string[];
}

interface StoredPermissionDocument {
	grants?: SitePermissionConfig["grants"];
	folders?: SitePermissionConfig["folders"];
	updatedAt?: string;
	updatedBy?: string;
	audit?: StoredPermissionAudit[];
}

function readConfig(data: StoredPermissionDocument | undefined): SitePermissionConfig {
	if (!data) return { grants: {}, folders: {} };
	return {
		grants: data.grants && typeof data.grants === "object" ? data.grants : {},
		folders: data.folders && typeof data.folders === "object" ? data.folders : {},
	};
}

export async function loadPermissionRecord(): Promise<{
	config: SitePermissionConfig;
	updatedAt: string;
	updatedBy: string;
	audit: StoredPermissionAudit[];
}> {
	const snapshot = await db.doc(CONFIG_DOC).get();
	if (!snapshot.exists) {
		return {
			config: { grants: {}, folders: {} },
			updatedAt: "",
			updatedBy: "",
			audit: [],
		};
	}
	const data = snapshot.data() as StoredPermissionDocument;
	return {
		config: readConfig(data),
		updatedAt: data.updatedAt || "",
		updatedBy: data.updatedBy || "",
		audit: Array.isArray(data.audit) ? data.audit : [],
	};
}

export async function loadPermissionConfig(): Promise<SitePermissionConfig> {
	const record = await loadPermissionRecord();
	return record.config;
}

export async function loadFolderRefs(): Promise<FolderRef[]> {
	const snapshot = await db.collection("globalFolders").get();
	return snapshot.docs.map((doc) => {
		const parentId = doc.data().parentId;
		return {
			id: doc.id,
			parentId: typeof parentId === "string" && parentId ? parentId : null,
		};
	});
}

export function formatAuditLine(line: PermissionAuditLine): string {
	const roles = SITE_ROLES
		.filter((role) => line.before[role] !== line.after[role])
		.map((role) => `${role}: ${line.before[role] ? "ja" : "nein"} → ${line.after[role] ? "ja" : "nein"}`);
	return `${line.key} (${roles.join(", ")})`;
}

export async function savePermissionConfig(next: SitePermissionConfig, uid: string): Promise<StoredPermissionAudit | null> {
	const ref = db.doc(CONFIG_DOC);
	const snapshot = await ref.get();
	const previous = readConfig(snapshot.exists ? snapshot.data() as StoredPermissionDocument : undefined);
	const folderIds = (await loadFolderRefs()).map((folder) => folder.id);
	const lines = permissionAuditLines(previous, next, folderIds);
	const auditEntry = lines.length
		? {
			at: new Date().toISOString(),
			uid,
			lines: lines.map(formatAuditLine),
		}
		: null;
	const existingAudit = snapshot.exists
		? ((snapshot.data() as StoredPermissionDocument).audit || [])
		: [];

	await ref.set({
		grants: next.grants,
		folders: next.folders,
		updatedAt: new Date().toISOString(),
		updatedBy: uid,
		audit: auditEntry ? [auditEntry, ...existingAudit].slice(0, AUDIT_LIMIT) : existingAudit,
	});

	return auditEntry;
}

export async function removeFolderPermissionOverrides(folderIds: string[]): Promise<void> {
	if (!folderIds.length) return;
	const ref = db.doc(CONFIG_DOC);
	const snapshot = await ref.get();
	if (!snapshot.exists) return;
	const current = readConfig(snapshot.data() as StoredPermissionDocument);
	let changed = false;
	for (const folderId of folderIds) {
		if (current.folders[folderId]) {
			delete current.folders[folderId];
			changed = true;
		}
	}
	if (!changed) return;
	await ref.set({
		grants: current.grants,
		folders: current.folders,
		updatedAt: new Date().toISOString(),
		updatedBy: "system",
	}, { merge: true });
}

export function buildPermissionCatalog(config: SitePermissionConfig) {
	return PERMISSION_ROWS.map((row) => ({
		key: row.key,
		group: row.group,
		locked: row.locked,
		grants: resolvedGrants(config, row.key),
	}));
}

export function assertKnownDocumentActions(value: string): value is (typeof DOCUMENT_ACTIONS)[number] {
	return (DOCUMENT_ACTIONS as readonly string[]).includes(value);
}

export { sanitizePermissionConfig };
