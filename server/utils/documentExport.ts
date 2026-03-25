const DEFAULT_EXPORT_EXTENSION = "html";

const LOCALE_LABELS: Record<string, string> = {
	de: "Deutsch",
	en: "English",
	fr: "Francais",
	it: "Italiano",
};

const escapeHtml = (value: string) => value
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;")
	.replace(/'/g, "&#39;");

const getBaseName = (fileName: string) => {
	const normalized = fileName.trim();
	const extensionIndex = normalized.lastIndexOf(".");
	return extensionIndex > 0 ? normalized.slice(0, extensionIndex) : normalized;
};

const sanitizeFileNamePart = (value: string) => value
	.normalize("NFD")
	.replace(/[\u0300-\u036f]/g, "")
	.replace(/[^a-zA-Z0-9._-]+/g, "-")
	.replace(/-+/g, "-")
	.replace(/^-|-$/g, "")
	.toLowerCase();

const renderParagraphs = (text: string) => {
	return text
		.trim()
		.split(/\n{2,}/)
		.filter(Boolean)
		.map((paragraph) => {
			const lines = paragraph
				.split("\n")
				.map((line) => escapeHtml(line.trim()))
				.filter(Boolean)
				.join("<br />");

			return lines ? `<p>${lines}</p>` : "";
		})
		.filter(Boolean)
		.join("\n");
};

export interface DocumentExportInput {
	fileName: string;
	locale: string;
	bodyText: string;
	summary?: string;
	sourceType?: string;
	generatedAt?: string;
	translatedAt?: string;
	model?: string;
}

export const buildTranslatedDocumentFileName = (
	originalFileName: string,
	locale: string,
	extension = DEFAULT_EXPORT_EXTENSION,
) => {
	const baseName = sanitizeFileNamePart(getBaseName(originalFileName)) || "document";
	const localePart = sanitizeFileNamePart(locale) || "translated";
	const extensionPart = sanitizeFileNamePart(extension) || DEFAULT_EXPORT_EXTENSION;
	return `${baseName}-${localePart}-translated.${extensionPart}`;
};

export const buildTranslatedDocumentHtml = (input: DocumentExportInput) => {
	const localeLabel = LOCALE_LABELS[input.locale] || input.locale.toUpperCase();
	const generatedAt = input.generatedAt || new Date().toISOString();
	const title = escapeHtml(getBaseName(input.fileName) || input.fileName);
	const summary = input.summary?.trim() ? `<p class="summary">${escapeHtml(input.summary.trim())}</p>` : "";
	const body = renderParagraphs(input.bodyText) || "<p>Kein Text verfugbar.</p>";
	const translatedAt = input.translatedAt ? new Date(input.translatedAt).toLocaleString("de-CH") : "Unbekannt";
	const model = input.model ? escapeHtml(input.model) : "Unbekannt";
	const sourceType = input.sourceType ? escapeHtml(input.sourceType) : "Dokument";

	return `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale)}">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${title} (${escapeHtml(localeLabel)})</title>
	<style>
		:root {
			color-scheme: light;
			--ink: #1f2933;
			--muted: #52606d;
			--line: #d9e2ec;
			--panel: #f7f4ee;
			--accent: #0b6e4f;
		}
		* { box-sizing: border-box; }
		body {
			margin: 0;
			padding: 40px 20px;
			background: linear-gradient(180deg, #f7f5ef 0%, #ffffff 100%);
			color: var(--ink);
			font-family: "Georgia", "Times New Roman", serif;
			line-height: 1.65;
		}
		article {
			max-width: 860px;
			margin: 0 auto;
			background: #ffffff;
			border: 1px solid var(--line);
			border-radius: 28px;
			box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
			overflow: hidden;
		}
		header {
			padding: 40px 44px 28px;
			background: var(--panel);
			border-bottom: 1px solid var(--line);
		}
		.kicker {
			margin: 0 0 10px;
			font: 700 12px/1.2 "Arial", sans-serif;
			letter-spacing: 0.18em;
			text-transform: uppercase;
			color: var(--accent);
		}
		h1 {
			margin: 0;
			font-size: clamp(2rem, 3vw, 2.8rem);
			line-height: 1.1;
		}
		.summary {
			margin: 18px 0 0;
			font-size: 1.05rem;
			color: var(--muted);
		}
		.meta {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
			gap: 14px;
			padding: 24px 44px;
			border-bottom: 1px solid var(--line);
			font-family: "Arial", sans-serif;
			font-size: 0.92rem;
		}
		.meta-label {
			display: block;
			margin-bottom: 4px;
			font-size: 0.72rem;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--muted);
		}
		section {
			padding: 32px 44px 40px;
		}
		p {
			margin: 0 0 1.1em;
		}
		@page {
			margin: 18mm;
		}
		@media print {
			body {
				padding: 0;
				background: #ffffff;
			}
			article {
				border: 0;
				box-shadow: none;
			}
		}
	</style>
</head>
<body>
	<article>
		<header>
			<p class="kicker">Automatisch neu gelayoutete Ubersetzung</p>
			<h1>${title}</h1>
			${summary}
		</header>
		<div class="meta">
			<div>
				<span class="meta-label">Sprache</span>
				<strong>${escapeHtml(localeLabel)}</strong>
			</div>
			<div>
				<span class="meta-label">Dokumenttyp</span>
				<strong>${sourceType}</strong>
			</div>
			<div>
				<span class="meta-label">Ubersetzt am</span>
				<strong>${escapeHtml(translatedAt)}</strong>
			</div>
			<div>
				<span class="meta-label">Generiert am</span>
				<strong>${escapeHtml(new Date(generatedAt).toLocaleString("de-CH"))}</strong>
			</div>
			<div>
				<span class="meta-label">Modell</span>
				<strong>${model}</strong>
			</div>
		</div>
		<section>
			${body}
		</section>
	</article>
</body>
</html>`;
};
