/**
 * Moves a photo inside the gallery order. Returns a new array; out-of-range or
 * no-op moves return the input order unchanged so callers can skip the save.
 */
export function movePhoto<T>(photos: readonly T[], from: number, to: number): T[] {
	const next = [...photos];

	if (from === to) return next;
	if (from < 0 || from >= next.length) return next;
	if (to < 0 || to >= next.length) return next;

	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved as T);

	return next;
}

/** True when both arrays hold the same entries in the same order. */
export function isSameOrder<T>(left: readonly T[], right: readonly T[]): boolean {
	return left.length === right.length && left.every((entry, index) => entry === right[index]);
}
