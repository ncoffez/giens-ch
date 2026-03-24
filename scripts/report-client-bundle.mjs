import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(".output/public/_nuxt");
const reportDir = path.resolve("reports/performance");
const reportPath = path.join(reportDir, "build-report.json");

async function main() {
	const files = await readdir(outputDir);
	const jsFiles = await Promise.all(
		files
			.filter((file) => file.endsWith(".js"))
			.map(async (file) => {
				const fullPath = path.join(outputDir, file);
				const fileStat = await stat(fullPath);

				return {
					file,
					bytes: fileStat.size,
					kilobytes: Number((fileStat.size / 1024).toFixed(2)),
				};
			}),
	);

	jsFiles.sort((left, right) => right.bytes - left.bytes);

	const report = {
		generatedAt: new Date().toISOString(),
		totalJsBytes: jsFiles.reduce((sum, file) => sum + file.bytes, 0),
		totalJsKilobytes: Number((jsFiles.reduce((sum, file) => sum + file.bytes, 0) / 1024).toFixed(2)),
		topClientChunks: jsFiles.slice(0, 20),
	};

	await mkdir(reportDir, { recursive: true });
	await writeFile(reportPath, `${JSON.stringify(report, null, "\t")}\n`, "utf8");

	console.log(`[perf] Wrote build report to ${path.relative(process.cwd(), reportPath)}`);
	console.table(report.topClientChunks.slice(0, 10));
}

main().catch((error) => {
	console.error("[perf] Failed to write build report", error);
	process.exitCode = 1;
});
