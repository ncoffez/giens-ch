import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Safari only supports import maps from iOS/iPadOS 16.4. Any bare module specifier
 * left in the client bundle (Nuxt emits "#entry" when experimental.entryImportMap
 * is enabled) makes older iPads and iPhones fail to boot the app with
 * 'Module specifier, "#entry" does not start with "/", "./", or "../"'.
 *
 * This guard fails the build if such a specifier reappears.
 */
const outputDir = path.resolve(".output/public/_nuxt");
const FORBIDDEN_SPECIFIERS = ["#entry"];

async function main() {
	let files;
	try {
		files = await readdir(outputDir);
	} catch {
		console.warn(`[guard] Skipped: ${path.relative(process.cwd(), outputDir)} does not exist.`);
		return;
	}

	const offenders = [];

	for (const file of files.filter((entry) => entry.endsWith(".js"))) {
		const contents = await readFile(path.join(outputDir, file), "utf8");
		const found = FORBIDDEN_SPECIFIERS.filter((specifier) => contents.includes(`"${specifier}"`));

		if (found.length) {
			offenders.push({ file, specifiers: found.join(", ") });
		}
	}

	if (offenders.length) {
		console.error("[guard] Bare module specifiers found in the client bundle:");
		console.table(offenders);
		console.error(
			"[guard] These require import map support (Safari 16.4+) and crash older iOS devices.\n"
			+ "[guard] Set experimental.entryImportMap: false in nuxt.config.ts.",
		);
		process.exit(1);
	}

	console.log(`[guard] No bare module specifiers in ${files.length} client bundle files.`);
}

main().catch((error) => {
	console.error("[guard] Failed to inspect the client bundle:", error);
	process.exit(1);
});
