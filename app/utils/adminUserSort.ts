export type SortDirection = "asc" | "desc";
export type AdminUserSortKey = "name" | "role" | "status";

export interface SortableAdminUser {
	displayName?: string | null;
	email?: string | null;
	disabled?: boolean;
	customClaims?: {
		admin?: boolean;
		publisher?: boolean;
		owner?: boolean;
		reader?: boolean;
	} | null;
}

function displayName(user: SortableAdminUser): string {
	return (user.displayName || user.email || "").trim();
}

function compareNames(left: SortableAdminUser, right: SortableAdminUser): number {
	return displayName(left).localeCompare(displayName(right), "de", { sensitivity: "base" });
}

/** Lower rank is the stronger permission. People with several roles use the strongest one. */
function roleRank(user: SortableAdminUser): number {
	const claims = user.customClaims;
	if (claims?.admin) return 0;
	if (claims?.publisher) return 1;
	if (claims?.owner) return 2;
	if (claims?.reader) return 3;
	return 4;
}

export function sortAdminUsers<T extends SortableAdminUser>(
	users: readonly T[],
	key: AdminUserSortKey,
	direction: SortDirection,
): T[] {
	const factor = direction === "desc" ? -1 : 1;

	return [...users].sort((left, right) => {
		if (key === "role") {
			const role = roleRank(left) - roleRank(right);
			if (role !== 0) return role * factor;
		}

		if (key === "status") {
			const status = Number(!!left.disabled) - Number(!!right.disabled);
			if (status !== 0) return status * factor;
		}

		const name = compareNames(left, right);
		return key === "name" ? name * factor : name;
	});
}

export function toggleSortDirection(direction: SortDirection): SortDirection {
	return direction === "asc" ? "desc" : "asc";
}
