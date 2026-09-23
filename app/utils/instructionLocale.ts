export type InstructionLocale = "de" | "fr";

export function instructionEditorLocale(siteLocale: string): InstructionLocale {
	return siteLocale === "fr" ? "fr" : "de";
}

export function instructionHtmlHasText(value: string | null | undefined): boolean {
	return (value || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.trim().length > 0;
}

export function shouldAutoTranslateInstructions(input: {
	loading: boolean;
	saving: boolean;
	alreadyAttempted: boolean;
	viewingLocale: InstructionLocale;
	sourceLocale: InstructionLocale;
	sourceHtml: string;
	targetHtml: string;
}): boolean {
	if (input.loading || input.saving || input.alreadyAttempted) return false;
	const targetLocale: InstructionLocale = input.sourceLocale === "de" ? "fr" : "de";
	if (input.viewingLocale !== targetLocale) return false;
	return instructionHtmlHasText(input.sourceHtml) && !instructionHtmlHasText(input.targetHtml);
}
