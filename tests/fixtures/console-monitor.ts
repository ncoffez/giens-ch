import { test as base } from '@playwright/test';
import { ConsoleMonitor } from '../helpers/console-monitor';

type ConsoleMonitorFixture = {
	consoleMonitor: ConsoleMonitor;
};

export const test = base.extend<ConsoleMonitorFixture>({
	consoleMonitor: async ({ page }, use) => {
		const monitor = new ConsoleMonitor(page);
		await use(monitor);
		monitor.clear();
	},
});

export const expect = base.expect;