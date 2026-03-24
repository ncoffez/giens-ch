import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const localeDir = path.join(projectRoot, "i18n", "locales");
const reportDir = path.join(projectRoot, "reports", "translations");
const sourceLocale = "de";
const locales = ["de", "fr"];

function flattenMessages(value, prefix = "", output = {}) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const [key, nestedValue] of Object.entries(value)) {
			const nextPrefix = prefix ? `${prefix}.${key}` : key;
			flattenMessages(nestedValue, nextPrefix, output);
		}
		return output;
	}

	output[prefix] = value;
	return output;
}

function isFilledTranslation(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function isReviewCandidate(sourceValue, targetValue) {
	if (!isFilledTranslation(sourceValue) || !isFilledTranslation(targetValue)) return false;
	return sourceValue === targetValue && /[A-Za-zÀ-ÿ]/.test(sourceValue);
}

const localePayloads = await Promise.all(
	locales.map(async (locale) => {
		const filePath = path.join(localeDir, `${locale}.json`);
		const content = await readFile(filePath, "utf8");
		return [locale, JSON.parse(content)];
	}),
);

const flattenedLocales = Object.fromEntries(
	localePayloads.map(([locale, messages]) => [locale, flattenMessages(messages)]),
);

const sourceEntries = flattenedLocales[sourceLocale];
const sourceKeys = Object.keys(sourceEntries).sort();

const report = {
	generatedAt: new Date().toISOString(),
	sourceLocale,
	totalKeys: sourceKeys.length,
	locales: {},
};

for (const locale of locales) {
	const entries = flattenedLocales[locale];
	const missingKeys = sourceKeys.filter((key) => !(key in entries));
	const translatedKeys = sourceKeys.filter((key) => isFilledTranslation(entries[key]));
	const reviewKeys = sourceKeys.filter((key) => isReviewCandidate(sourceEntries[key], entries[key]));
	const extraKeys = Object.keys(entries).filter((key) => !(key in sourceEntries)).sort();
	const coverage = Number(((translatedKeys.length / sourceKeys.length) * 100).toFixed(2));

	report.locales[locale] = {
		translatedKeys: translatedKeys.length,
		missingKeys,
		extraKeys,
		reviewKeys,
		coverage,
	};
}

await mkdir(reportDir, { recursive: true });
await writeFile(path.join(reportDir, "translation-report.json"), JSON.stringify(report, null, 2));

console.log(`[translations] Source locale: ${sourceLocale}`);
console.table(
	locales.map((locale) => ({
		locale,
		coverage: `${report.locales[locale].coverage}%`,
		missing: report.locales[locale].missingKeys.length,
		extra: report.locales[locale].extraKeys.length,
		review: report.locales[locale].reviewKeys.length,
	})),
);

const hasMissingKeys = locales.some((locale) => report.locales[locale].missingKeys.length > 0);

if (hasMissingKeys) {
	console.error("[translations] Missing translation keys detected.");
	process.exitCode = 1;
}
