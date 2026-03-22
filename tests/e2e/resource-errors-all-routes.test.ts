import { test, expect } from '@playwright/test';

const ALL_ROUTES = [
	'/',
	'/about',
	'/travel',
	'/login',
	'/register',
	'/reset-password',
	'/organisatorisches',
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
	'/homes',
	'/homes/new',
];

test.describe('All Routes - Basic Load Test', () => {
	ALL_ROUTES.forEach((route) => {
		test(`${route}`, async ({ page }) => {
			await page.goto(route);
			await page.waitForLoadState('networkidle');
			expect(page.url()).toContain('localhost:3000');
		});
	});
});