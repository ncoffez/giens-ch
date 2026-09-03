import { beforeEach, describe, expect, it } from "vitest";
import { useMobileMenu } from "../../app/composables/useMobileMenu";

describe("useMobileMenu", () => {
	beforeEach(() => {
		const { closeMenu, open } = useMobileMenu();
		open.value = false;
		closeMenu();
	});

	it("exposes a writable open ref that closeMenu clears", () => {
		const { open, openMenu, closeMenu } = useMobileMenu();

		openMenu();
		open.value = false;
		expect(open.value).toBe(false);

		openMenu();
		closeMenu();
		expect(open.value).toBe(false);
	});

	it("mounts lazily and opens the sheet", () => {
		const { open, isMounted, openMenu } = useMobileMenu();

		openMenu();

		expect(isMounted.value).toBe(true);
		expect(open.value).toBe(true);
	});

	it("closes without unmounting so the sheet can reopen immediately", () => {
		const { open, isMounted, openMenu, closeMenu } = useMobileMenu();

		openMenu();
		closeMenu();

		expect(open.value).toBe(false);
		expect(isMounted.value).toBe(true);

		openMenu();
		expect(open.value).toBe(true);
	});

	it("shares the same open state across callers", () => {
		const first = useMobileMenu();
		const second = useMobileMenu();

		first.openMenu();
		expect(second.open.value).toBe(true);

		second.closeMenu();
		expect(first.open.value).toBe(false);
	});
});
