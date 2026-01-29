import { test, expect } from '@playwright/test';

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

test.describe('All Routes - Basic Load Test', () => {
	ALL_ROUTES.forEach((route) => {
		test(`${route}`, async ({ page }) => {
			await page.goto(route);
			await page.waitForLoadState('networkidle');
			const finalUrl = page.url();
if (!route.startsWith('/admin') && !route.startsWith('/profile') && !route.startsWith('/owner') && !route.startsWith('/homes')) {
	expect(finalUrl).toContain(route);
}
		});
	});
});