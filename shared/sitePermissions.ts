export const SITE_ROLES = ["admin", "publisher", "owner", "reader"] as const;

export type SiteRole = (typeof SITE_ROLES)[number];

export const DOCUMENT_ACTIONS = ["createFolder", "upload", "open", "rename", "move", "delete"] as const;

export type DocumentAction = (typeof DOCUMENT_ACTIONS)[number];

export type PermissionGroup = "public" | "documents" | "home" | "memoriam" | "admin";

export interface RoleGrants {
	admin: boolean;
	publisher: boolean;
	owner: boolean;
	reader: boolean;
}

export interface PermissionClaimSet {
	admin?: boolean;
	publisher?: boolean;
	owner?: boolean;
	reader?: boolean;
	uid?: string;
}

export interface PermissionRow {
	key: string;
	group: PermissionGroup;
	locked: boolean;
	defaults: RoleGrants;
}

export interface FolderRef {
	id: string;
	parentId: string | null;
}

export interface FolderActionOverride {
	[action: string]: Partial<RoleGrants> | undefined;
}

export interface SitePermissionConfig {
	grants: Record<string, Partial<RoleGrants>>;
	folders: Record<string, FolderActionOverride>;
}

const yes = (admin: boolean, publisher: boolean, owner: boolean, reader: boolean): RoleGrants => ({
	admin,
	publisher,
	owner,
	reader,
});

const adminOnly = yes(true, false, false, false);
const adminOwner = yes(true, false, true, false);

export const PERMISSION_ROWS: PermissionRow[] = [
	{ key: "page.home.edit", group: "public", locked: false, defaults: adminOnly },
	{ key: "page.travel.edit", group: "public", locked: false, defaults: adminOnly },
	{ key: "page.entdecken.edit", group: "public", locked: false, defaults: adminOnly },
	{ key: "page.organisatorisches.edit", group: "public", locked: false, defaults: adminOnly },
	{ key: "documents.createFolder", group: "documents", locked: false, defaults: adminOwner },
	{ key: "documents.upload", group: "documents", locked: false, defaults: adminOwner },
	{ key: "documents.open", group: "documents", locked: false, defaults: yes(true, false, true, true) },
	{ key: "documents.rename", group: "documents", locked: false, defaults: adminOnly },
	{ key: "documents.move", group: "documents", locked: false, defaults: adminOnly },
	{ key: "documents.delete", group: "documents", locked: false, defaults: adminOwner },
	{ key: "home.links.manage", group: "home", locked: false, defaults: adminOwner },
	{ key: "home.photos.upload", group: "home", locked: false, defaults: adminOwner },
	{ key: "home.wifi.edit", group: "home", locked: false, defaults: adminOwner },
	{ key: "home.contacts.manage", group: "home", locked: false, defaults: adminOwner },
	{ key: "home.instructions.edit", group: "home", locked: false, defaults: adminOwner },
	{ key: "home.files.upload", group: "home", locked: false, defaults: adminOwner },
	{ key: "memoriam.view", group: "memoriam", locked: false, defaults: adminOwner },
	{ key: "memoriam.manage", group: "memoriam", locked: false, defaults: adminOnly },
	{ key: "admin.homes.manage", group: "admin", locked: false, defaults: adminOnly },
	{ key: "admin.trash.manage", group: "admin", locked: false, defaults: adminOnly },
	{ key: "admin.settings.manage", group: "admin", locked: false, defaults: adminOnly },
	{ key: "admin.users.manage", group: "admin", locked: true, defaults: adminOnly },
	{ key: "admin.permissions.manage", group: "admin", locked: true, defaults: adminOnly },
];

export const ADMIN_SHELL_KEYS = [
	"admin.users.manage",
	"admin.permissions.manage",
	"admin.homes.manage",
	"admin.trash.manage",
	"admin.settings.manage",
	"memoriam.manage",
];

export const HOME_SECTION_KEYS = [
	"home.links.manage",
	"home.photos.upload",
	"home.wifi.edit",
	"home.contacts.manage",
	"home.instructions.edit",
	"home.files.upload",
];

const ROW_BY_KEY = new Map(PERMISSION_ROWS.map((row) => [row.key, row]));

export const EMPTY_PERMISSION_CONFIG: SitePermissionConfig = {
	grants: {},
	folders: {},
};

export function isDocumentAction(value: string): value is DocumentAction {
	return (DOCUMENT_ACTIONS as readonly string[]).includes(value);
}

export function emptyGrants(): RoleGrants {
	return { admin: false, publisher: false, owner: false, reader: false };
}

export function normalizeGrants(value: Partial<RoleGrants> | null | undefined, fallback: RoleGrants = emptyGrants()): RoleGrants {
	return {
		admin: typeof value?.admin === "boolean" ? value.admin : fallback.admin,
		publisher: typeof value?.publisher === "boolean" ? value.publisher : fallback.publisher,
		owner: typeof value?.owner === "boolean" ? value.owner : fallback.owner,
		reader: typeof value?.reader === "boolean" ? value.reader : fallback.reader,
	};
}

export function grantsEqual(left: RoleGrants, right: RoleGrants): boolean {
	return SITE_ROLES.every((role) => left[role] === right[role]);
}

export function permissionRow(key: string): PermissionRow | undefined {
	return ROW_BY_KEY.get(key);
}

export function resolvedGrants(config: SitePermissionConfig, key: string): RoleGrants {
	const row = ROW_BY_KEY.get(key);
	if (!row) return emptyGrants();
	if (row.locked) return { ...row.defaults };
	return normalizeGrants(config.grants[key], row.defaults);
}

export function claimsAllow(claims: PermissionClaimSet | null | undefined, grants: RoleGrants): boolean {
	if (!claims) return false;
	return SITE_ROLES.some((role) => !!claims[role] && grants[role]);
}

export function canPerform(config: SitePermissionConfig, claims: PermissionClaimSet | null | undefined, key: string): boolean {
	return claimsAllow(claims, resolvedGrants(config, key));
}

export function canEnterAdminShell(config: SitePermissionConfig, claims: PermissionClaimSet | null | undefined): boolean {
	return ADMIN_SHELL_KEYS.some((key) => canPerform(config, claims, key));
}

function folderMap(folders: FolderRef[]): Map<string, FolderRef> {
	return new Map(folders.map((folder) => [folder.id, folder]));
}

function parentIdOf(foldersById: Map<string, FolderRef>, folderId: string | null): string | null {
	if (!folderId) return null;
	return foldersById.get(folderId)?.parentId ?? null;
}

export function folderActionGrants(
	config: SitePermissionConfig,
	folders: FolderRef[],
	folderId: string | null,
	action: DocumentAction,
): { grants: RoleGrants; explicit: boolean } {
	const areaKey = `documents.${action}`;
	if (!folderId) {
		return { grants: resolvedGrants(config, areaKey), explicit: false };
	}

	const foldersById = folderMap(folders);
	const seen = new Set<string>();
	let current: string | null = folderId;

	while (current) {
		if (seen.has(current)) break;
		seen.add(current);
		const explicit = config.folders[current]?.[action];
		if (explicit && SITE_ROLES.every((role) => typeof explicit[role] === "boolean")) {
			return {
				grants: normalizeGrants(explicit, resolvedGrants(config, areaKey)),
				explicit: current === folderId,
			};
		}
		current = parentIdOf(foldersById, current);
	}

	return { grants: resolvedGrants(config, areaKey), explicit: false };
}

function roleCanOpenFolder(
	config: SitePermissionConfig,
	folders: FolderRef[],
	folderId: string,
	role: SiteRole,
): boolean {
	const foldersById = folderMap(folders);
	const seen = new Set<string>();
	let current: string | null = folderId;

	while (current) {
		if (seen.has(current)) return false;
		seen.add(current);
		if (!folderActionGrants(config, folders, current, "open").grants[role]) return false;
		current = parentIdOf(foldersById, current);
	}

	return true;
}

export function effectiveFolderGrants(
	config: SitePermissionConfig,
	folders: FolderRef[],
	folderId: string | null,
	action: DocumentAction,
): { grants: RoleGrants; explicit: boolean } {
	const resolved = folderActionGrants(config, folders, folderId, action);
	if (!folderId || action === "open") {
		if (!folderId) return resolved;
		const grants = emptyGrants();
		for (const role of SITE_ROLES) {
			grants[role] = roleCanOpenFolder(config, folders, folderId, role);
		}
		return { grants, explicit: resolved.explicit };
	}

	const grants = emptyGrants();
	for (const role of SITE_ROLES) {
		grants[role] = resolved.grants[role] && roleCanOpenFolder(config, folders, folderId, role);
	}
	return { grants, explicit: resolved.explicit };
}

export function canPerformFolderAction(
	config: SitePermissionConfig,
	folders: FolderRef[],
	claims: PermissionClaimSet | null | undefined,
	folderId: string | null,
	action: DocumentAction,
): boolean {
	if (!folderId) {
		if (action !== "open" && !canPerform(config, claims, "documents.open")) return false;
		return canPerform(config, claims, `documents.${action}`);
	}

	return claimsAllow(claims, effectiveFolderGrants(config, folders, folderId, action).grants);
}

export function canAccessDocuments(
	config: SitePermissionConfig,
	folders: FolderRef[],
	claims: PermissionClaimSet | null | undefined,
): boolean {
	if (canPerform(config, claims, "documents.open")) return true;
	return folders.some((folder) => canPerformFolderAction(config, folders, claims, folder.id, "open"));
}

export function canEditHomeSection(
	config: SitePermissionConfig,
	claims: PermissionClaimSet | null | undefined,
	listedOnHome: boolean,
	key: string,
): boolean {
	const grants = resolvedGrants(config, key);
	if (!claimsAllow(claims, grants)) return false;
	if (listedOnHome) return true;
	return !!(claims?.admin && grants.admin);
}

export function canOpenHome(
	config: SitePermissionConfig,
	claims: PermissionClaimSet | null | undefined,
	listedOnHome: boolean,
): boolean {
	if (listedOnHome) return true;
	if (!claims?.admin) return false;
	return HOME_SECTION_KEYS.some((key) => resolvedGrants(config, key).admin);
}

export interface PermissionAuditLine {
	key: string;
	before: RoleGrants;
	after: RoleGrants;
}

export function diffGrants(key: string, before: RoleGrants, after: RoleGrants): PermissionAuditLine | null {
	if (grantsEqual(before, after)) return null;
	return { key, before, after };
}

export function sanitizePermissionConfig(
	input: { grants?: unknown; folders?: unknown },
	folderIds: Set<string>,
): SitePermissionConfig {
	const grants: Record<string, Partial<RoleGrants>> = {};

	if (input.grants && typeof input.grants === "object") {
		for (const [key, value] of Object.entries(input.grants as Record<string, unknown>)) {
			const row = ROW_BY_KEY.get(key);
			if (!row || row.locked || !value || typeof value !== "object") continue;
			grants[key] = normalizeGrants(value as Partial<RoleGrants>, row.defaults);
		}
	}

	const folders: Record<string, FolderActionOverride> = {};
	if (input.folders && typeof input.folders === "object") {
		for (const [folderId, value] of Object.entries(input.folders as Record<string, unknown>)) {
			if (!folderIds.has(folderId) || !value || typeof value !== "object") continue;
			const actions: FolderActionOverride = {};
			for (const [action, grantsValue] of Object.entries(value as Record<string, unknown>)) {
				if (!isDocumentAction(action) || !grantsValue || typeof grantsValue !== "object") continue;
				actions[action] = normalizeGrants(grantsValue as Partial<RoleGrants>);
			}
			if (Object.keys(actions).length > 0) {
				folders[folderId] = actions;
			}
		}
	}

	return { grants, folders };
}

export function permissionAuditLines(
	before: SitePermissionConfig,
	after: SitePermissionConfig,
	folderIds: string[],
): PermissionAuditLine[] {
	const lines: PermissionAuditLine[] = [];

	for (const row of PERMISSION_ROWS) {
		if (row.locked) continue;
		const change = diffGrants(row.key, resolvedGrants(before, row.key), resolvedGrants(after, row.key));
		if (change) lines.push(change);
	}

	const ids = new Set([...folderIds, ...Object.keys(before.folders), ...Object.keys(after.folders)]);
	for (const folderId of ids) {
		for (const action of DOCUMENT_ACTIONS) {
			const previous = folderActionGrants(before, [], folderId, action);
			const next = folderActionGrants(after, [], folderId, action);
			const previousGrants = before.folders[folderId]?.[action]
				? normalizeGrants(before.folders[folderId]?.[action])
				: null;
			const nextGrants = after.folders[folderId]?.[action]
				? normalizeGrants(after.folders[folderId]?.[action])
				: null;
			if (!previousGrants && !nextGrants) continue;
			const change = diffGrants(
				`folder.${folderId}.${action}`,
				previousGrants || previous.grants,
				nextGrants || next.grants,
			);
			if (change) lines.push(change);
		}
	}

	return lines;
}
