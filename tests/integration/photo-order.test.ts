import { describe, expect, it } from "vitest";
import { isSameOrder, movePhoto } from "../../app/utils/photoOrder";

describe("movePhoto", () => {
	const photos = ["a", "b", "c", "d"];

	it("moves a photo forward", () => {
		expect(movePhoto(photos, 2, 0)).toEqual(["c", "a", "b", "d"]);
	});

	it("moves a photo backward", () => {
		expect(movePhoto(photos, 0, 2)).toEqual(["b", "c", "a", "d"]);
	});

	it("swaps neighbours", () => {
		expect(movePhoto(photos, 1, 2)).toEqual(["a", "c", "b", "d"]);
	});

	it("returns the same order for a no-op move", () => {
		expect(movePhoto(photos, 1, 1)).toEqual(photos);
	});

	it("ignores out-of-range indices", () => {
		expect(movePhoto(photos, -1, 2)).toEqual(photos);
		expect(movePhoto(photos, 0, 9)).toEqual(photos);
		expect(movePhoto(photos, 9, 0)).toEqual(photos);
	});

	it("does not mutate the input", () => {
		const original = [...photos];
		movePhoto(photos, 0, 3);

		expect(photos).toEqual(original);
	});

	it("keeps every photo", () => {
		const result = movePhoto(photos, 3, 0);

		expect([...result].sort()).toEqual([...photos].sort());
		expect(result).toHaveLength(photos.length);
	});
});

describe("isSameOrder", () => {
	it("detects an unchanged order", () => {
		expect(isSameOrder(["a", "b"], ["a", "b"])).toBe(true);
	});

	it("detects a changed order", () => {
		expect(isSameOrder(["a", "b"], ["b", "a"])).toBe(false);
	});

	it("detects a different length", () => {
		expect(isSameOrder(["a"], ["a", "b"])).toBe(false);
	});
});
