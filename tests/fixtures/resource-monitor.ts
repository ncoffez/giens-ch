import { test as base } from '@playwright/test';
import { ResourceMonitor } from '../helpers/resource-monitor';

type ResourceMonitorFixture = {
	resourceMonitor: ResourceMonitor;
};

export const test = base.extend<ResourceMonitorFixture>({
	resourceMonitor: async ({ page }, use) => {
		const monitor = new ResourceMonitor(page);
		await use(monitor);
		monitor.clear();
	},
});

export const expect = base.expect;