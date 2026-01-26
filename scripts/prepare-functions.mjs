import { copyFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { join } from "path";

const root = process.cwd();
const outputDir = join(root, ".output/server");
const targetModules = join(outputDir, "node_modules");

// Ensure node_modules exists in .output/server
if (!existsSync(targetModules)) {
	mkdirSync(targetModules, { recursive: true });
}

const modulesToCopy = ["firebase-functions", "firebase-admin"];

for (const mod of modulesToCopy) {
	const source = join(root, "node_modules", mod);
	const destination = join(targetModules, mod);

	if (existsSync(source)) {
		console.log(`Copying ${mod} to ${destination}...`);
		cpSync(source, destination, { recursive: true });
	} else {
		console.error(`Source module not found: ${source}`);
		process.exit(1);
	}
}

console.log("Function staging complete.");
