import type { Page, Response, TestInfo } from "@playwright/test";

export interface ResourceFailure {
	type: 'image' | 'css' | 'font' | 'script' | 'stylesheet' | 'other';
	url: string;
	status: number | null;
	error: string;
	timestamp: string;
}

export class ResourceMonitor {
	private failures: ResourceFailure[] = [];
	private listenersSetup = false;

	constructor(private page: Page) {
		this.setupListeners();
	}

	private setupListeners(): void {
		if (this.listenersSetup) {
			return;
		}

		// Monitor failed network responses (404, 500, etc.)
		this.page.on('response', async (response) => {
			const type = this.getResourceType(response);
			
			if (type && response.status() >= 400) {
				this.failures.push({
					type,
					url: response.url(),
					status: response.status(),
					error: `HTTP ${response.status()}`,
					timestamp: new Date().toISOString(),
				});
			}
		});

		// Monitor request failures (aborted, failed)
		this.page.on('requestfailed', (request) => {
			const type = this.getResourceTypeByURL(request.url());
			
			if (type) {
				this.failures.push({
					type,
					url: request.url(),
					status: null,
					error: request.failure()!.errorText,
					timestamp: new Date().toISOString(),
				});
			}
		});

		// Monitor console error messages related to resources
		this.page.on('console', (msg) => {
			if (msg.type() === 'error') {
				const messageText = msg.text();
				
				// Check for image-related errors
				if (this.isImageError(messageText)) {
					this.failures.push({
						type: 'image',
						url: this.extractUrlFromError(messageText) || 'unknown',
						status: null,
						error: messageText,
						timestamp: new Date().toISOString(),
					});
				}

				// Check for resource loading errors
				if (this.isResourceError(messageText)) {
					this.failures.push({
						type: this.extractResourceTypeFromError(messageText) || 'other',
						url: this.extractUrlFromError(messageText) || 'unknown',
						status: null,
						error: messageText,
						timestamp: new Date().toISOString(),
					});
				}
			}
		});

		this.listenersSetup = true;
	}

	private getResourceType(response: Response): 'image' | 'css' | 'font' | 'script' | 'stylesheet' | 'other' | null {
		const resourceType = response.request().resourceType();
		switch (resourceType) {
			case 'image':
				return 'image';
			case 'stylesheet':
				return 'css';
			case 'font':
				return 'font';
			case 'script':
				return 'script';
			default:
				return null;
		}
	}

	private getResourceTypeByURL(url: string): 'image' | 'css' | 'font' | 'script' | null {
		const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'webp':
			case 'svg':
			case 'ico':
				return 'image';
			case 'css':
				return 'css';
			case 'woff':
			case 'woff2':
			case 'ttf':
			case 'otf':
			case 'eot':
				return 'font';
			case 'js':
			case 'mjs':
			case 'cjs':
				return 'script';
			default:
				return null;
		}
	}

	private isImageError(message: string): boolean {
		const imageKeywords = ['image', 'img', 'jpg', 'png', 'gif', 'webp', 'jpeg'];
		const errorKeywords = ['failed to load', 'error loading', 'loading failed', '404', '403'];
		
		const lowerMessage = message.toLowerCase();
		
		return imageKeywords.some((keyword) => lowerMessage.includes(keyword)) &&
		       errorKeywords.some((keyword) => lowerMessage.includes(keyword));
	}

	private isResourceError(message: string): boolean {
		const errorPatterns = [
			/failed to load resource/i,
			/failed to fetch/i,
			/network error/i,
			/mixed content/i,
			/csp/i,
		];

		return errorPatterns.some((pattern) => pattern.test(message));
	}

	private extractUrlFromError(message: string): string | null {
		try {
			// Try to extract URL from common error formats
			const urlMatch = message.match(/https?:\/\/[^\s"'`<>]+/i);
			return urlMatch ? urlMatch[0] : null;
		} catch {
			return null;
		}
	}

	private extractResourceTypeFromError(message: string): 'image' | 'css' | 'font' | 'script' | 'other' | null {
		const lowerMessage = message.toLowerCase();
		
		if (/image|jpg|png|gif|webp|jpeg/i.test(message)) return 'image';
		if (/css|stylesheet/i.test(message)) return 'css';
		if (/font|woff|ttf/i.test(message)) return 'font';
		if (/script|js/i.test(message)) return 'script';
		
		return 'other';
	}

	getFailures(): ResourceFailure[] {
		return this.failures;
	}

	getBrokenImages(): ResourceFailure[] {
		return this.failures.filter((f) => f.type === 'image');
	}

	getBrokenCSS(): ResourceFailure[] {
		return this.failures.filter((f) => f.type === 'css');
	}

	getBrokenFonts(): ResourceFailure[] {
		return this.failures.filter((f) => f.type === 'font');
	}

	getBrokenJS(): ResourceFailure[] {
		return this.failures.filter((f) => f.type === 'script');
	}

	async attachToTestReport(testInfo: TestInfo): Promise<void> {
		if (this.failures.length === 0) {
			return;
		}

		const report = JSON.stringify(this.failures, null, 2);
		await testInfo.attach('resource-failures', {
			body: report,
			contentType: 'application/json',
		});
	}

	async attachBrokenImagesToTestReport(testInfo: TestInfo): Promise<void> {
		const brokenImages = this.getBrokenImages();
		if (brokenImages.length === 0) {
			return;
		}

		const report = JSON.stringify(brokenImages, null, 2);
		await testInfo.attach('broken-images', {
			body: report,
			contentType: 'application/json',
		});
	}

	async attachBrokenResourceSummaryToTestReport(testInfo: TestInfo): Promise<void> {
		if (this.failures.length === 0) {
			return;
		}

		const summary = this.createSummary();
		await testInfo.attach('resource-failure-summary', {
			body: summary,
			contentType: 'text/plain',
		});
	}

	createSummary(): string {
		const images = this.getBrokenImages().length;
		const css = this.getBrokenCSS().length;
		const fonts = this.getBrokenFonts().length;
		const js = this.getBrokenJS().length;
		const others = this.failures.length - images - css - fonts - js;

		return `Resource Failures Summary:
  Images: ${images}
  CSS: ${css}
  Fonts: ${fonts}
  Scripts: ${js}
  Other: ${others}
  Total: ${this.failures.length}

${this.failures.length > 0 ? '\nFailures:\n' + this.failures.map((f) => `  - [${f.type.toUpperCase()}] ${f.url}\n    Status: ${f.status || 'Request Failed'}\n    Error: ${f.error}`).join('\n\n') : 'No failures.'}`;
	}

	hasFailures(): boolean {
		return this.failures.length > 0;
	}

	hasBrokenImages(): boolean {
		return this.getBrokenImages().length > 0;
	}

	hasBrokenCSS(): boolean {
		return this.getBrokenCSS().length > 0;
	}

	hasBrokenFonts(): boolean {
		return this.getBrokenFonts().length > 0;
	}

	hasBrokenJS(): boolean {
		return this.getBrokenJS().length > 0;
	}

	clear(): void {
		this.failures = [];
	}
}