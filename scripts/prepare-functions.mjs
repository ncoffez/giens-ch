import { copyFileSync, mkdirSync, existsSync, cpSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const outputDir = join(root, ".output/server");
const targetModules = join(outputDir, "node_modules");
const packageJsonPath = join(outputDir, "package.json");

// Clean up package.json to remove platform-specific sharp dependencies
if (existsSync(packageJsonPath)) {
	console.log("Cleaning up .output/server/package.json...");
	const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
	if (pkg.dependencies) {
		const originalDeps = { ...pkg.dependencies };
		let changed = false;
		for (const dep of Object.keys(pkg.dependencies)) {
			if (dep.startsWith("@img/sharp-")) {
				console.log(`Removing platform-specific dependency: ${dep}`);
				delete pkg.dependencies[dep];
				changed = true;
			}
		}
		if (changed) {
			writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
			console.log("Updated package.json.");
		}
	}
}

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
