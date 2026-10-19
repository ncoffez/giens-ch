const YEAR_PREFIX = /^(\d{4})(?!\d)/;

/** Returns the leading 4-digit year of a folder name ("2025", "2025 Bulletin"), or null. */
export function getFolderYear(name: string | null | undefined): number | null {
	const match = YEAR_PREFIX.exec((name || "").trim());
	return match ? Number(match[1]) : null;
}

/**
 * Compares two folders so that year folders always come first, newest year on top,
 * regardless of the active sort mode. Non-year folders and folders of the same year
 * fall back to the given comparator (the current sort mode).
 */
export function compareFoldersWithYears<T extends { name: string }>(
	left: T,
	right: T,
	fallback: (left: T, right: T) => number,
): number {
	const leftYear = getFolderYear(left.name);
	const rightYear = getFolderYear(right.name);

	if (leftYear !== null && rightYear !== null) {
		if (leftYear !== rightYear) return rightYear - leftYear;
		return fallback(left, right);
	}
	if (leftYear !== null) return -1;
	if (rightYear !== null) return 1;

	return fallback(left, right);
}
