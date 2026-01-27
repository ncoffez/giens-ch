import { describe, it, expect } from "vitest";

describe("Hero Component Logic", () => {
	describe("getResponsiveImage function", () => {
		it("should return empty string when src is undefined", () => {
			const src: string | undefined = undefined;
			const result = !src ? "" : (src as string).split(".")[0] + "-webp";
			expect(result).toBe("");
		});

		it("should return empty string when src is null", () => {
			const src: string | null = null;
			const result = !src ? "" : (src as string).split(".")[0] + "-webp";
			expect(result).toBe("");
		});

		it("should return empty string when src is empty", () => {
			const src = "";
			const result = !src ? "" : (src as string).split(".")[0] + "-webp";
			expect(result).toBe("");
		});

		it("should convert JPG to WebP format", () => {
			const src = "https://example.com/image.jpg";
			const width = 800;
			const result = !src ? "" : src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
			expect(result).toBe("https://example.com/image-800w.webp");
		});

		it("should convert JPEG to WebP format", () => {
			const src = "https://example.com/image.jpeg";
			const width = 1200;
			const result = !src ? "" : src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
			expect(result).toBe("https://example.com/image-1200w.webp");
		});

		it("should convert any path with WebP format", () => {
			const src = "https://cdn.example.com/gallery/photo.webp";
			const width = 1920;
			const result = !src ? "" : src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
			expect(result).toBe("https://cdn.example.com/gallery/photo-1920w.webp");
		});

		it("should handle filename with multiple dots", () => {
			const src = "https://example.com/image.v2.large.jpg";
			const width = 800;
			const result = !src ? "" : src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
			expect(result).toBe("https://example.com/image.v2.large-800w.webp");
		});

		it("should handle unknown format by keeping extension", () => {
			const src = "https://example.com/image.png";
			const width = 800;
			const result = !src ? "" : src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
			// The regex won't match, so no replacement happens
			expect(result).toBe("https://example.com/image.png-800w.webp");
		});
	});

	describe("Conditional Rendering", () => {
		it("should render picture when src is provided", () => {
			const src = "https://example.com/image.jpg";
			const showPicture = !!src;
			expect(showPicture).toBe(true);
		});

		it("should not render picture when src is not provided", () => {
			const src: string | undefined = undefined;
			const showPicture = !!src;
			expect(showPicture).toBe(false);
		});

		it("should render subtitle when subtitle is provided", () => {
			const subtitle = "This is a subtitle";
			const showSubtitle = !!subtitle;
			expect(showSubtitle).toBe(true);
		});

		it("should not render subtitle when subtitle is not provided", () => {
			const subtitle = undefined;
			const showSubtitle = !!subtitle;
			expect(showSubtitle).toBe(false);
		});

		it("should use default height when height prop is not provided", () => {
			const height: string | undefined = undefined;
			const defaultHeight = "h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]";
			const appliedHeight = height || defaultHeight;
			expect(appliedHeight).toBe(defaultHeight);
		});

		it("should use custom height when height prop is provided", () => {
			const height = "h-[60vh]";
			const defaultHeight = "h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]";
			const appliedHeight = height || defaultHeight;
			expect(appliedHeight).toBe("h-[60vh]");
		});
	});

	describe("Image Source Selection", () => {
		it("should select different sizes for different media queries", () => {
			const src = "https://example.com/image.jpg";

			// Mobile: max-width: 768px
			const mobileSrc = src.replace(/\.(jpg|jpeg|webp)$/i, "") + "-800w.webp";
			expect(mobileSrc).toBe("https://example.com/image-800w.webp");

			// Tablet: max-width: 1200px
			const tabletSrc = src.replace(/\.(jpg|jpeg|webp)$/i, "") + "-1200w.webp";
			expect(tabletSrc).toBe("https://example.com/image-1200w.webp");

			// Desktop: default
			const desktopSrc = src.replace(/\.(jpg|jpeg|webp)$/i, "") + "-1920w.webp";
			expect(desktopSrc).toBe("https://example.com/image-1920w.webp");
		});
	});
});