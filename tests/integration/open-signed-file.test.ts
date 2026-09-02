import { afterEach, describe, expect, it, vi } from "vitest";
import { openAfterAsyncNavigation } from "../../app/utils/openSignedFile";

describe("openAfterAsyncNavigation", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("opens a blank tab before awaiting the signed URL", async () => {
		const order: string[] = [];
		const popup = {
			closed: false,
			location: { replace: vi.fn() },
			close: vi.fn(),
		};

		vi.spyOn(window, "open").mockImplementation(() => {
			order.push("open");
			return popup as unknown as Window;
		});

		await openAfterAsyncNavigation(async () => {
			order.push("fetch");
			return "https://example.com/file.pdf";
		});

		expect(order).toEqual(["open", "fetch"]);
		expect(popup.location.replace).toHaveBeenCalledWith("https://example.com/file.pdf");
	});

	it("closes the blank tab when fetching the URL fails", async () => {
		const popup = {
			closed: false,
			location: { replace: vi.fn() },
			close: vi.fn(),
		};

		vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

		await expect(
			openAfterAsyncNavigation(async () => {
				throw new Error("nope");
			}),
		).rejects.toThrow("nope");

		expect(popup.close).toHaveBeenCalled();
		expect(popup.location.replace).not.toHaveBeenCalled();
	});
});
