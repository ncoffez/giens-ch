import { describe, expect, it } from "vitest";
import {
	buildInstructionsFields,
	detectInstructionsLocale,
	hashInstructions,
	otherInstructionsLocale,
	planInstructionsUpdate,
	readInstructions,
} from "../../server/utils/homeInstructions";

const GERMAN = "<p>Der Schlüssel ist im Schrank und die Heizung wird mit dem Regler eingestellt. Bitte nicht das Fenster offen lassen.</p>";
const FRENCH = "<p>La clé est dans le placard et le chauffage se règle avec le bouton. Merci de ne pas laisser la fenêtre ouverte.</p>";

describe("detectInstructionsLocale", () => {
	it("detects German", () => {
		expect(detectInstructionsLocale(GERMAN)).toBe("de");
	});

	it("detects French", () => {
		expect(detectInstructionsLocale(FRENCH)).toBe("fr");
	});

	it("returns null when there is no signal", () => {
		expect(detectInstructionsLocale("")).toBeNull();
		expect(detectInstructionsLocale(undefined)).toBeNull();
		expect(detectInstructionsLocale("<p>WIFI: 12345678</p>")).toBeNull();
	});
});

describe("readInstructions", () => {
	it("upgrades a legacy home with only `instructions`", () => {
		const result = readInstructions({ instructions: GERMAN });

		expect(result.byLocale.de).toBe(GERMAN);
		expect(result.byLocale.fr).toBeUndefined();
	});

	it("respects a stored source locale for legacy data", () => {
		const result = readInstructions({ instructions: FRENCH, instructionsSourceLocale: "fr" });

		expect(result.byLocale.fr).toBe(FRENCH);
		expect(result.sourceLocale).toBe("fr");
	});
});

describe("planInstructionsUpdate", () => {
	it("translates German into French for a German home", () => {
		const plan = planInstructionsUpdate(null, {
			instructionsByLocale: { de: GERMAN },
			instructionsSourceLocale: "de",
		});

		expect(plan.sourceLocale).toBe("de");
		expect(plan.targetLocale).toBe("fr");
		expect(plan.source).toBe(GERMAN);
		expect(plan.shouldTranslate).toBe(true);
	});

	it("translates French into German for a French home", () => {
		const plan = planInstructionsUpdate(null, {
			instructionsByLocale: { fr: FRENCH },
			instructionsSourceLocale: "fr",
		});

		expect(plan.sourceLocale).toBe("fr");
		expect(plan.targetLocale).toBe("de");
		expect(plan.source).toBe(FRENCH);
		expect(plan.shouldTranslate).toBe(true);
	});

	it("falls back to detection when no source locale is known", () => {
		const plan = planInstructionsUpdate(null, { instructions: FRENCH });

		expect(plan.sourceLocale).toBe("fr");
		expect(plan.targetLocale).toBe("de");
	});

	it("defaults to German when nothing can be detected", () => {
		const plan = planInstructionsUpdate(null, { instructions: "<p>WLAN 1234</p>" });

		expect(plan.sourceLocale).toBe("de");
	});

	it("skips translation when the source has not changed", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: true, sourceHash: hashInstructions(GERMAN) } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsSourceLocale: "de",
		});

		expect(plan.shouldTranslate).toBe(false);
	});

	it("retranslates when the source changed", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: true, sourceHash: hashInstructions(GERMAN) } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: `${GERMAN}<p>Neu: Abfall am Dienstag.</p>`, fr: FRENCH },
			instructionsSourceLocale: "de",
		});

		expect(plan.shouldTranslate).toBe(true);
	});

	it("never overwrites a hand-edited translation", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: true, sourceHash: hashInstructions(GERMAN) } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: `${GERMAN}<p>Mehr Text.</p>`, fr: `${FRENCH}<p>Corrigé à la main.</p>` },
			instructionsSourceLocale: "de",
		});

		expect(plan.targetIsManual).toBe(true);
		expect(plan.shouldTranslate).toBe(false);
	});

	it("keeps a translation manual on later saves", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: false } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: `${GERMAN}<p>Noch mehr.</p>`, fr: FRENCH },
			instructionsSourceLocale: "de",
		});

		expect(plan.shouldTranslate).toBe(false);
	});

	it("forces a retranslation when asked, even over a manual edit", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: false } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsSourceLocale: "de",
			forceTranslateInstructions: true,
		});

		expect(plan.shouldTranslate).toBe(true);
		expect(plan.targetIsManual).toBe(false);
	});

	it("does not translate empty instructions", () => {
		const plan = planInstructionsUpdate(null, {
			instructionsByLocale: { de: "<p></p>" },
			instructionsSourceLocale: "de",
		});

		expect(plan.shouldTranslate).toBe(false);
	});

	it("switches direction when the owner changes the source language", () => {
		const existing = {
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: true, sourceHash: hashInstructions(GERMAN) } },
		};

		const plan = planInstructionsUpdate(existing, {
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsSourceLocale: "fr",
		});

		expect(plan.sourceLocale).toBe("fr");
		expect(plan.targetLocale).toBe("de");
		expect(plan.source).toBe(FRENCH);
	});
});

describe("buildInstructionsFields", () => {
	it("stores both languages and mirrors the source into `instructions`", () => {
		const plan = planInstructionsUpdate(null, {
			instructionsByLocale: { de: GERMAN },
			instructionsSourceLocale: "de",
		});

		const fields = buildInstructionsFields(plan, FRENCH) as any;

		expect(fields.instructions).toBe(GERMAN);
		expect(fields.instructionsSourceLocale).toBe("de");
		expect(fields.instructionsByLocale.de).toBe(GERMAN);
		expect(fields.instructionsByLocale.fr).toBe(FRENCH);
		expect(fields.instructionsMeta.de.auto).toBe(false);
		expect(fields.instructionsMeta.fr.auto).toBe(true);
		expect(fields.instructionsMeta.fr.sourceHash).toBe(hashInstructions(GERMAN));
	});

	it("keeps the previous translation when the model failed", () => {
		const plan = planInstructionsUpdate({
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
		}, {
			instructionsByLocale: { de: `${GERMAN}<p>Neu.</p>`, fr: FRENCH },
			instructionsSourceLocale: "de",
		});

		const fields = buildInstructionsFields(plan, null) as any;

		expect(fields.instructionsByLocale.fr).toBe(FRENCH);
	});

	it("marks a hand-edited translation as manual", () => {
		const plan = planInstructionsUpdate({
			instructionsSourceLocale: "de",
			instructionsByLocale: { de: GERMAN, fr: FRENCH },
			instructionsMeta: { fr: { auto: false } },
		}, {
			instructionsByLocale: { de: GERMAN, fr: `${FRENCH}<p>Corrigé.</p>` },
			instructionsSourceLocale: "de",
		});

		const fields = buildInstructionsFields(plan, null) as any;

		expect(fields.instructionsMeta.fr.auto).toBe(false);
		expect(fields.instructionsMeta.fr.sourceHash).toBeUndefined();
	});

	it("never writes undefined values (Firestore rejects them)", () => {
		const plan = planInstructionsUpdate(null, {
			instructionsByLocale: { de: GERMAN },
			instructionsSourceLocale: "de",
		});

		const fields = buildInstructionsFields(plan, null) as any;

		for (const entry of Object.values(fields.instructionsMeta) as any[]) {
			expect(Object.values(entry).some((value) => value === undefined)).toBe(false);
		}
	});
});

describe("otherInstructionsLocale", () => {
	it("flips the locale", () => {
		expect(otherInstructionsLocale("de")).toBe("fr");
		expect(otherInstructionsLocale("fr")).toBe("de");
	});
});
