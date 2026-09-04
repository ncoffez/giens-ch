import { describe, expect, it, vi } from "vitest";

vi.mock("../../server/useFirebaseAdmin", () => ({
	db: {},
	auth: {},
	storage: {},
}));

const { pickGlobalSettingsPatch } = await import("../../server/utils/homes");

describe("pickGlobalSettingsPatch", () => {
	it("keeps only the three writable settings fields", () => {
		expect(pickGlobalSettingsPatch({
			maxHomeNumber: 12,
			washingMachineUse: "Keller",
			homesFeatureGloballyEnabled: true,
			admin: true,
			id: "global",
			updatedAt: "nope",
		})).toEqual({
			maxHomeNumber: 12,
			washingMachineUse: "Keller",
			homesFeatureGloballyEnabled: true,
		});
	});

	it("returns an empty patch for missing or non-object bodies", () => {
		expect(pickGlobalSettingsPatch(undefined)).toEqual({});
		expect(pickGlobalSettingsPatch("admin")).toEqual({});
	});
});
