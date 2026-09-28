export interface PermissionTreeFolder {
	id: string;
	name: string;
	parentId: string | null;
}

export interface PermissionTreeRow<T extends PermissionTreeFolder> {
	folder: T;
	depth: number;
	childCount: number;
	expanded: boolean;
}

function sortLocale(locale: string): string {
	return locale === "fr" ? "fr" : "de";
}

function compareNames(left: string, right: string, locale: string): number {
	return left.localeCompare(right, sortLocale(locale), { sensitivity: "base" });
}

function nameMatches(name: string, query: string, locale: string): boolean {
	return name.toLocaleLowerCase(sortLocale(locale)).includes(query);
}

/**
 * Parent used for display. A missing parent becomes a root.
 * A cycle is opened at its lowest id so every folder stays reachable once.
 */
export function permissionFolderDisplayParent<T extends PermissionTreeFolder>(
	folder: T,
	byId: ReadonlyMap<string, T>,
): string | null {
	const parentId = folder.parentId;
	if (!parentId || !byId.has(parentId)) return null;

	const path = [folder.id];
	const index = new Map<string, number>([[folder.id, 0]]);
	let current: string | null = parentId;
	while (current) {
		const seenAt = index.get(current);
		if (seenAt !== undefined) {
			const cycleIds = path.slice(seenAt);
			const rootId = [...cycleIds].sort((left, right) => left.localeCompare(right))[0];
			return folder.id === rootId ? null : parentId;
		}
		const parent = byId.get(current);
		if (!parent) return null;
		index.set(current, path.length);
		path.push(current);
		current = parent.parentId;
	}
	return parentId;
}

function childrenByParent<T extends PermissionTreeFolder>(
	folders: readonly T[],
	locale: string,
): Map<string | null, T[]> {
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const grouped = new Map<string | null, T[]>();
	for (const folder of folders) {
		const parentId = permissionFolderDisplayParent(folder, byId);
		const siblings = grouped.get(parentId) || [];
		siblings.push(folder);
		grouped.set(parentId, siblings);
	}
	for (const siblings of grouped.values()) {
		siblings.sort((left, right) => compareNames(left.name, right.name, locale));
	}
	return grouped;
}

/** Ancestors first, then the folder itself. Stops if a parent link loops. */
export function permissionFolderPath<T extends PermissionTreeFolder>(
	folders: readonly T[],
	folderId: string,
): T[] {
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const start = byId.get(folderId);
	if (!start) return [];

	const leafToRoot: T[] = [];
	const seen = new Set<string>();
	let current: T | undefined = start;
	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		leafToRoot.push(current);
		const parentId = permissionFolderDisplayParent(current, byId);
		current = parentId ? byId.get(parentId) : undefined;
	}
	return leafToRoot.reverse();
}

/**
 * Visible rows of a collapsible folder tree.
 * A search keeps matching folders and the ancestors needed to reach them, opened.
 */
export function visiblePermissionFolders<T extends PermissionTreeFolder>(
	folders: readonly T[],
	expandedIds: ReadonlySet<string>,
	locale: string,
	nameQuery = "",
): Array<PermissionTreeRow<T>> {
	const query = nameQuery.trim().toLocaleLowerCase(sortLocale(locale));
	const grouped = childrenByParent(folders, locale);
	const rows: Array<PermissionTreeRow<T>> = [];

	const hasMatchingDescendant = (folder: T, ancestors: ReadonlySet<string>): boolean => {
		const nextAncestors = new Set(ancestors);
		nextAncestors.add(folder.id);
		const children = grouped.get(folder.id) || [];
		return children.some((child) => {
			if (nextAncestors.has(child.id)) return false;
			return nameMatches(child.name, query, locale) || hasMatchingDescendant(child, nextAncestors);
		});
	};

	const walk = (parentId: string | null, depth: number, ancestors: Set<string>) => {
		for (const folder of grouped.get(parentId) || []) {
			if (ancestors.has(folder.id)) continue;
			const childCount = (grouped.get(folder.id) || []).length;
			const matchesDescendant = query ? hasMatchingDescendant(folder, ancestors) : false;
			const matchesSelf = !query || nameMatches(folder.name, query, locale);
			if (query && !matchesSelf && !matchesDescendant) continue;
			const expanded = childCount > 0 && (query ? matchesDescendant : expandedIds.has(folder.id));
			rows.push({ folder, depth, childCount, expanded });
			if (!expanded) continue;
			const nextAncestors = new Set(ancestors);
			nextAncestors.add(folder.id);
			walk(folder.id, depth + 1, nextAncestors);
		}
	};

	walk(null, 0, new Set());
	return rows;
}

export interface PermissionFolderChange {
	id: string;
	name: string;
	actions: string[];
}

/**
 * Own changed actions, plus every descendant that has some, in tree order.
 * Ancestors stay in the map even when they still use the default.
 */
export function permissionFolderChangeIndex<T extends PermissionTreeFolder>(
	folders: readonly T[],
	actionsByFolderId: ReadonlyMap<string, readonly string[]>,
	locale: string,
): Map<string, { actions: string[]; below: PermissionFolderChange[] }> {
	const grouped = childrenByParent(folders, locale);
	const result = new Map<string, { actions: string[]; below: PermissionFolderChange[] }>();

	const visit = (folder: T, ancestors: Set<string>): PermissionFolderChange[] => {
		const nextAncestors = new Set(ancestors);
		nextAncestors.add(folder.id);
		const below: PermissionFolderChange[] = [];
		for (const child of grouped.get(folder.id) || []) {
			if (nextAncestors.has(child.id)) continue;
			const childActions = [...(actionsByFolderId.get(child.id) || [])];
			if (childActions.length > 0) {
				below.push({ id: child.id, name: child.name, actions: childActions });
			}
			below.push(...visit(child, nextAncestors));
		}
		result.set(folder.id, {
			actions: [...(actionsByFolderId.get(folder.id) || [])],
			below,
		});
		return below;
	};

	for (const folder of grouped.get(null) || []) {
		visit(folder, new Set());
	}
	return result;
}

/** Folder ids that have a descendant in `markedIds`, not the marked folders themselves. */
export function permissionFolderIdsWithMarkedDescendant<T extends PermissionTreeFolder>(
	folders: readonly T[],
	markedIds: ReadonlySet<string>,
	locale: string,
): Set<string> {
	const grouped = childrenByParent(folders, locale);
	const result = new Set<string>();

	const subtreeMarked = (folder: T, ancestors: Set<string>): boolean => {
		const nextAncestors = new Set(ancestors);
		nextAncestors.add(folder.id);
		let descendantMarked = false;
		for (const child of grouped.get(folder.id) || []) {
			if (nextAncestors.has(child.id)) continue;
			if (markedIds.has(child.id) || subtreeMarked(child, nextAncestors)) {
				descendantMarked = true;
			}
		}
		if (descendantMarked) result.add(folder.id);
		return markedIds.has(folder.id) || descendantMarked;
	};

	for (const folder of grouped.get(null) || []) {
		subtreeMarked(folder, new Set());
	}
	return result;
}
