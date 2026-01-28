import type { Page, TestInfo } from "@playwright/test";

export interface ConsoleError {
	type: 'error' | 'warning';
	message: string;
	url?: string;
	timestamp: string;
}

export class ConsoleMonitor {
	private errors: ConsoleError[] = [];
	private warnings: ConsoleError[] = [];

	constructor(private page: Page) {
		this.setupListeners();
	}

	private setupListeners(): void {
		this.page.on('console', (msg) => {
			const currentUrl = this.page.url();
			const messageText = msg.text();

			if (msg.type() === 'error') {
				if (messageText.includes('Hydration completed but contains mismatches')) {
					return;
				}
				this.errors.push({
					type: 'error',
					message: messageText,
					url: currentUrl,
					timestamp: new Date().toISOString(),
				});
			}
			else if (msg.type() === 'warning') {
				this.warnings.push({
					type: 'warning',
					message: messageText,
					url: currentUrl,
					timestamp: new Date().toISOString(),
				});
			}
		});

		this.page.on('pageerror', (error) => {
			this.errors.push({
				type: 'error',
				message: error.message,
				timestamp: new Date().toISOString(),
			});
		});
	}

	getErrors(): ConsoleError[] {
		return this.errors;
	}

	getWarnings(): ConsoleError[] {
		return this.warnings;
	}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}

	async attachToTestReport(testInfo: TestInfo): Promise<void> {
		if (!this.hasErrors()) {
			return;
		}

		const errorLog = this.errors.map(
			(e, i) => `[${i + 1}] ${e.type.toUpperCase()}: ${e.message}\n   URL: ${e.url}\n   Time: ${e.timestamp}`
		).join('\n');

		await testInfo.attach('console-errors', {
			body: errorLog,
			contentType: 'text/plain',
		});
	}

	async attachWarningsToTestReport(testInfo: TestInfo): Promise<void> {
		if (this.warnings.length === 0) {
			return;
		}

		const warningsLog = this.warnings.map(
			(e, i) => `[${i + 1}] ${e.type.toUpperCase()}: ${e.message}\n   URL: ${e.url}\n   Time: ${e.timestamp}`
		).join('\n');

		await testInfo.attach('console-warnings', {
			body: warningsLog,
			contentType: 'text/plain',
		});
	}

	async attachAllLogsToTestReport(testInfo: TestInfo): Promise<void> {
		await this.attachToTestReport(testInfo);
		await this.attachWarningsToTestReport(testInfo);
	}

	getErrorSummary(): string {
		return this.errors.length > 0
			? `Found ${this.errors.length} error(s):\n${this.errors.map((e, i) => `  ${i + 1}. ${e.message}`).join('\n')}`
			: 'No errors.';
	}

	getWarningSummary(): string {
		return this.warnings.length > 0
			? `Found ${this.warnings.length} warning(s):\n${this.warnings.map((e, i) => `  ${i + 1}. ${e.message}`).join('\n')}`
			: 'No warnings.';
	}

	clear(): void {
		this.errors = [];
		this.warnings = [];
	}
}