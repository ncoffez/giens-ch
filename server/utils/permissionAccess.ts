import { createError, type H3Event } from "h3";
import {
	canAccessDocuments,
	canEditHomeSection,
	canEnterAdminShell,
	canOpenHome,
	canPerform,
	canPerformFolderAction,
	type DocumentAction,
	type PermissionClaimSet,
	type SitePermissionConfig,
} from "../../shared/sitePermissions";
import { requireSignedIn } from "./auth";
import { canManageHomeFiles } from "./fileAccess";
import { getHomeById } from "./homes";
import { loadFolderRefs, loadPermissionConfig } from "./permissionConfig";

export async function requireAreaPermission(event: H3Event, key: string) {
	const claims = await requireSignedIn(event);
	const config = await loadPermissionConfig();
	if (!canPerform(config, claims, key)) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	return { claims, config };
}

export async function requireAnyAreaPermission(event: H3Event, keys: string[]) {
	const claims = await requireSignedIn(event);
	const config = await loadPermissionConfig();
	if (!keys.some((key) => canPerform(config, claims, key))) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	return { claims, config };
}

export async function requireAdminShell(event: H3Event) {
	const claims = await requireSignedIn(event);
	const config = await loadPermissionConfig();
	if (!canEnterAdminShell(config, claims)) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	return { claims, config };
}

export async function assertDocumentAction(
	claims: PermissionClaimSet,
	folderId: string | null,
	action: DocumentAction,
) {
	const [config, folders] = await Promise.all([
		loadPermissionConfig(),
		loadFolderRefs(),
	]);
	if (!canPerformFolderAction(config, folders, claims, folderId, action)) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	return { config, folders };
}

export async function documentAccessForClaims(claims: PermissionClaimSet | null) {
	const [config, folders] = await Promise.all([
		loadPermissionConfig(),
		loadFolderRefs(),
	]);
	return { config, folders, allowed: canAccessDocuments(config, folders, claims) };
}

export async function assertHomeSection(event: H3Event, homeId: string, key: string) {
	const claims = await requireSignedIn(event);
	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}
	const config = await loadPermissionConfig();
	const listed = canManageHomeFiles(claims, home);
	if (!canEditHomeSection(config, claims, listed, key)) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}
	return { claims, home, config, listed };
}

export async function assertHomeReadable(event: H3Event, homeId: string) {
	const claims = await requireSignedIn(event);
	const home = await getHomeById(homeId);
	if (!home) {
		throw createError({ statusCode: 404, message: "Home not found" });
	}
	const config = await loadPermissionConfig();
	const listed = canManageHomeFiles(claims, home);
	if (!canOpenHome(config, claims, listed)) {
		throw createError({ statusCode: 403, message: "Forbidden: You don't have access to this home" });
	}
	return { claims, home, config, listed };
}

export function changedHomeSections(
	existing: {
		name?: string;
		wifiSSID?: string;
		wifiPassword?: string;
		instructions?: string;
		instructionsSourceLocale?: string;
		instructionsByLocale?: { de?: string; fr?: string };
		photos?: string[];
		contacts?: unknown;
		files?: unknown;
		folders?: unknown;
	},
	body: Record<string, unknown>,
): string[] {
	const keys: string[] = [];
	const textChanged = (field: string, current: string | undefined) => {
		return typeof body[field] === "string" && body[field] !== (current || "");
	};

	if (textChanged("wifiSSID", existing.wifiSSID) || textChanged("wifiPassword", existing.wifiPassword)) {
		keys.push("home.wifi.edit");
	}

	if (instructionsChanged(existing, body)) {
		keys.push("home.instructions.edit");
	}

	if (body.photos !== undefined && JSON.stringify(body.photos) !== JSON.stringify(existing.photos || [])) {
		keys.push("home.photos.upload");
	}

	if (body.contacts !== undefined && JSON.stringify(body.contacts) !== JSON.stringify(existing.contacts || [])) {
		keys.push("home.contacts.manage");
	}

	if (
		(body.files !== undefined && JSON.stringify(body.files) !== JSON.stringify(existing.files || []))
		|| (body.folders !== undefined && JSON.stringify(body.folders) !== JSON.stringify(existing.folders || []))
	) {
		keys.push("home.files.upload");
	}

	return keys;
}

function instructionsChanged(
	existing: {
		instructions?: string;
		instructionsSourceLocale?: string;
		instructionsByLocale?: { de?: string; fr?: string };
	},
	body: Record<string, unknown>,
): boolean {
	if (typeof body.instructions === "string" && body.instructions !== (existing.instructions || "")) return true;
	if (typeof body.instructionsSourceLocale === "string" && body.instructionsSourceLocale !== existing.instructionsSourceLocale) {
		return true;
	}
	if (!body.instructionsByLocale || typeof body.instructionsByLocale !== "object") return false;
	const incoming = body.instructionsByLocale as { de?: string; fr?: string };
	const current = existing.instructionsByLocale || {};
	return (incoming.de !== undefined && incoming.de !== (current.de || ""))
		|| (incoming.fr !== undefined && incoming.fr !== (current.fr || ""));
}

export async function assertHomeUpdate(event: H3Event, homeId: string, body: Record<string, unknown>) {
	const access = await assertHomeReadable(event, homeId);
	const nameChanged = typeof body.name === "string" && body.name !== access.home.name;
	if (nameChanged && !access.listed && !access.claims.admin) {
		throw createError({ statusCode: 403, message: "Forbidden" });
	}

	for (const key of changedHomeSections(access.home, body)) {
		if (!canEditHomeSection(access.config, access.claims, access.listed, key)) {
			throw createError({ statusCode: 403, message: "Forbidden" });
		}
	}

	return access;
}

export function actionsForFolder(
	config: SitePermissionConfig,
	folders: Awaited<ReturnType<typeof loadFolderRefs>>,
	claims: PermissionClaimSet,
	folderId: string | null,
) {
	const actions = ["createFolder", "upload", "open", "rename", "move", "delete"] as const;
	return Object.fromEntries(actions.map((action) => [
		action,
		canPerformFolderAction(config, folders, claims, folderId, action),
	])) as Record<(typeof actions)[number], boolean>;
}
