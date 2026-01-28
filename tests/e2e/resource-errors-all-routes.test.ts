import { test, expect } from '../fixtures/resource-monitor';
const { describe } = test;

const ALL_ROUTES = [
	'/',
	'/about',
	'/travel',
	'/login',
	'/register',
	'/reset-password',
	'/news',
	'/news/news',
	'/news/dokumente',
	'/news/photos',
	'/news/travaux',
	'/news/events',
	'/news/all',
	'/news/eigentuemerversammlung',
	'/profile',
	'/profile/me',
	'/profile/me/password',
	'/profile/me/picture',
	'/admin',
	'/admin/homes',
	'/admin/users',
	'/admin/labels',
	'/admin/settings',
	'/owner',
	'/owner/contacts',
	'/owner/photos',
	'/owner/documents',
	'/owner/news',
	'/homes',
	'/homes/new',
];

describe('All Routes - Resource Error Detection', () => {
	let errorCount = 0;
	let imageErrors = 0;
	let cssErrors = 0;
	let fontErrors = 0;
	let jsErrors = 0;

	test.beforeEach(() => {
		errorCount = 0;
		imageErrors = 0;
		cssErrors = 0;
		fontErrors = 0;
		jsErrors = 0;
	});

	test.afterAll(() => {
		if (errorCount > 0 || imageErrors > 0 || cssErrors > 0 || fontErrors > 0 || jsErrors > 0) {
			console.log('\n📊 Resource Error Summary:');
			console.log(`  Total Errors: ${errorCount}`);
			console.log(`  Images: ${imageErrors}`);
			console.log(`  CSS: ${cssErrors}`);
			console.log(`  Fonts: ${fontErrors}`);
			console.log(`  Scripts: ${jsErrors}`);
		} else {
			console.log('\n✅ All resources loaded successfully');
		}
	});

	ALL_ROUTES.forEach((route) => {
		test(`${route}`, async ({ page, resourceMonitor }, testInfo) => {
			await page.goto(route);
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(500);

			const failures = resourceMonitor.getFailures();
			const brokenImages = resourceMonitor.getBrokenImages();
			const brokenCSS = resourceMonitor.getBrokenCSS();
			const brokenFonts = resourceMonitor.getBrokenFonts();
			const brokenJS = resourceMonitor.getBrokenJS();

			if (failures.length === 0) {
				return; // No errors, skip this test
			}

			// Count errors by type
			imageErrors += brokenImages.length;
			cssErrors += brokenCSS.length;
			fontErrors += brokenFonts.length;
			jsErrors += brokenJS.length;
			errorCount++;

			// Attach detailed report for debugging
			await resourceMonitor.attachBrokenResourceSummaryToTestReport(testInfo);
			await resourceMonitor.attachToTestReport(testInfo);

			// Check specifically for broken images
			if (brokenImages.length > 0) {
				await resourceMonitor.attachBrokenImagesToTestReport(testInfo);
				const imageDetails = brokenImages.map((f) => `  - ${f.url} (Status: ${f.status || 'Failed'})`).join('\n');
				throw new Error(`Broken images on ${route}:\n${imageDetails}`);
			}

			// Check for CSS and font errors
			if (brokenCSS.length > 0 || brokenFonts.length > 0) {
				const cssDetails = brokenCSS.length > 0 ? `\nCSS Errors (${brokenCSS.length}):\n${brokenCSS.map((f) => `  - ${f.url} (${f.error})`).join('\n')}` : '';
				const fontDetails = brokenFonts.length > 0 ? `\nFont Errors (${brokenFonts.length}):\n${brokenFonts.map((f) => `  - ${f.url} (${f.error})`).join('\n')}` : '';
				throw new Error(`Resource errors on ${route}:${cssDetails}${fontDetails}`);
			}

			// Check for JS errors
			if (brokenJS.length > 0) {
				const jsDetails = brokenJS.map((f) => `  - ${f.url} (${f.error})`).join('\n');
				throw new Error(`Script errors on ${route}:\n${jsDetails}`);
			}
		});
	});
});