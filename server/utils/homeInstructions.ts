import { hasTranslatableText } from "./htmlTranslation";

export const INSTRUCTION_LOCALES = ["de", "fr"] as const;
export type InstructionsLocale = (typeof INSTRUCTION_LOCALES)[number];

export const DEFAULT_INSTRUCTIONS_LOCALE: InstructionsLocale = "de";

export interface InstructionsMetaEntry {
	/** True while the text is machine-generated and may be regenerated freely. */
	auto: boolean;
	/** Hash of the source text this translation was produced from. */
	sourceHash?: string;
	translatedAt?: string;
}

export interface InstructionsRecord {
	instructions?: string;
	instructionsSourceLocale?: string;
	instructionsByLocale?: Record<string, string>;
	instructionsMeta?: Record<string, InstructionsMetaEntry>;
}

export interface InstructionsInput {
	instructions?: string;
	instructionsSourceLocale?: string;
	instructionsByLocale?: Record<string, string>;
	/** Set by the "translate again" button to overwrite an edited translation. */
	forceTranslateInstructions?: boolean;
}

export function isInstructionsLocale(value: unknown): value is InstructionsLocale {
	return typeof value === "string" && (INSTRUCTION_LOCALES as readonly string[]).includes(value);
}

export function otherInstructionsLocale(locale: InstructionsLocale): InstructionsLocale {
	return locale === "de" ? "fr" : "de";
}

/** Small stable hash; only used to notice that the source text changed. */
export function hashInstructions(text: string): string {
	let hash = 5381;

	for (let i = 0; i < text.length; i++) {
		hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
	}

	return hash.toString(16);
}

function stripTags(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&[a-z]+;/gi, " ")
		.toLowerCase();
}

const DE_MARKERS = [
	"der", "die", "das", "und", "ist", "nicht", "mit", "ein", "eine", "sie", "wird",
	"für", "auf", "bitte", "sich", "im", "beim", "wenn", "auch", "haus", "schlüssel",
];

const FR_MARKERS = [
	"le", "la", "les", "et", "est", "ne", "pas", "avec", "un", "une", "vous", "pour",
	"sur", "dans", "merci", "veuillez", "votre", "maison", "clé", "s'il",
];

function countMarkers(text: string, markers: string[]): number {
	const words = text.split(/[^a-zà-ÿ']+/i).filter(Boolean);
	const counts = new Map<string, number>();

	for (const word of words) {
		counts.set(word, (counts.get(word) || 0) + 1);
	}

	return markers.reduce((total, marker) => total + (counts.get(marker) || 0), 0);
}

/**
 * Cheap stop-word based language guess. Returns null when the text gives no clear
 * signal, so the caller can ask the model or fall back to the default.
 */
export function detectInstructionsLocale(html: string | undefined | null): InstructionsLocale | null {
	if (!html || !hasTranslatableText(html)) return null;

	const text = stripTags(html);
	const de = countMarkers(text, DE_MARKERS);
	const fr = countMarkers(text, FR_MARKERS);

	if (de === fr) return null;

	// A single stray marker is not enough to overrule the other language.
	const winner = de > fr ? "de" : "fr";
	const margin = Math.abs(de - fr);

	return margin >= 2 || Math.max(de, fr) >= 3 ? winner : null;
}

export interface InstructionsPlan {
	sourceLocale: InstructionsLocale;
	targetLocale: InstructionsLocale;
	source: string;
	target: string;
	/** True when the target text was written or edited by a person. */
	targetIsManual: boolean;
	shouldTranslate: boolean;
	sourceHash: string;
}

/** Reads a stored home into the per-locale shape, upgrading legacy single-field data. */
export function readInstructions(record: InstructionsRecord | null | undefined) {
	const sourceLocale = isInstructionsLocale(record?.instructionsSourceLocale)
		? record.instructionsSourceLocale
		: null;
	const byLocale: Partial<Record<InstructionsLocale, string>> = {};

	for (const locale of INSTRUCTION_LOCALES) {
		const value = record?.instructionsByLocale?.[locale];
		if (typeof value === "string") byLocale[locale] = value;
	}

	// Legacy homes only have `instructions`, which was always the source text.
	if (!byLocale.de && !byLocale.fr && typeof record?.instructions === "string") {
		byLocale[sourceLocale || DEFAULT_INSTRUCTIONS_LOCALE] = record.instructions;
	}

	return {
		sourceLocale,
		byLocale,
		meta: (record?.instructionsMeta || {}) as Record<string, InstructionsMetaEntry>,
	};
}

/**
 * Decides which locale is the source, which text to translate, and whether a
 * translation is needed at all. A hand-edited translation is never regenerated
 * unless the caller explicitly forces it.
 */
export function planInstructionsUpdate(
	existingRecord: InstructionsRecord | null | undefined,
	incoming: InstructionsInput,
): InstructionsPlan {
	const existing = readInstructions(existingRecord);

	const incomingByLocale: Partial<Record<InstructionsLocale, string>> = {};
	for (const locale of INSTRUCTION_LOCALES) {
		const value = incoming.instructionsByLocale?.[locale];
		if (typeof value === "string") incomingByLocale[locale] = value;
	}

	const requestedLocale = isInstructionsLocale(incoming.instructionsSourceLocale)
		? incoming.instructionsSourceLocale
		: null;

	// A legacy single-field save targets whichever locale is already the source.
	if (typeof incoming.instructions === "string" && Object.keys(incomingByLocale).length === 0) {
		incomingByLocale[requestedLocale || existing.sourceLocale || DEFAULT_INSTRUCTIONS_LOCALE] = incoming.instructions;
	}

	const provisionalLocale = requestedLocale || existing.sourceLocale;
	const provisionalSource = provisionalLocale
		? incomingByLocale[provisionalLocale] ?? existing.byLocale[provisionalLocale] ?? ""
		: incomingByLocale.de ?? incomingByLocale.fr ?? existing.byLocale.de ?? existing.byLocale.fr ?? "";

	const sourceLocale = provisionalLocale
		|| detectInstructionsLocale(provisionalSource)
		|| DEFAULT_INSTRUCTIONS_LOCALE;
	const targetLocale = otherInstructionsLocale(sourceLocale);

	const source = incomingByLocale[sourceLocale] ?? existing.byLocale[sourceLocale] ?? "";
	const existingTarget = existing.byLocale[targetLocale] ?? "";
	const target = incomingByLocale[targetLocale] ?? existingTarget;

	const wasAuto = existing.meta[targetLocale]?.auto !== false;
	const targetEditedNow = incomingByLocale[targetLocale] !== undefined
		&& incomingByLocale[targetLocale] !== existingTarget
		&& hasTranslatableText(incomingByLocale[targetLocale]);
	const targetIsManual = incoming.forceTranslateInstructions ? false : targetEditedNow || !wasAuto;

	const sourceHash = hashInstructions(source);
	const shouldTranslate = (() => {
		if (!hasTranslatableText(source)) return false;
		if (incoming.forceTranslateInstructions) return true;
		if (targetIsManual) return false;
		if (!hasTranslatableText(target)) return true;
		return existing.meta[targetLocale]?.sourceHash !== sourceHash;
	})();

	return { sourceLocale, targetLocale, source, target, targetIsManual, shouldTranslate, sourceHash };
}

/** The fields to persist once the translation (if any) has been produced. */
export function buildInstructionsFields(
	plan: InstructionsPlan,
	translated: string | null,
): Record<string, unknown> {
	const targetText = translated ?? plan.target;
	const now = new Date().toISOString();

	const meta: Record<string, InstructionsMetaEntry> = {
		[plan.sourceLocale]: { auto: false },
		[plan.targetLocale]: plan.targetIsManual
			? { auto: false }
			: {
				auto: true,
				sourceHash: plan.sourceHash,
				translatedAt: translated ? now : undefined,
			},
	};

	// Firestore rejects undefined values.
	for (const entry of Object.values(meta)) {
		if (entry.translatedAt === undefined) delete entry.translatedAt;
		if (entry.sourceHash === undefined) delete entry.sourceHash;
	}

	return {
		instructions: plan.source,
		instructionsSourceLocale: plan.sourceLocale,
		instructionsByLocale: {
			[plan.sourceLocale]: plan.source,
			[plan.targetLocale]: targetText,
		},
		instructionsMeta: meta,
	};
}
