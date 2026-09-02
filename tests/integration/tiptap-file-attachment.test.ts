import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import { DOMParser as ProseMirrorDOMParser, DOMSerializer } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { FileAttachment } from "../../app/utils/tiptap/fileAttachment";

const schema = getSchema([StarterKit.configure({ link: false }), FileAttachment]);

function parse(html: string) {
	const dom = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
	return ProseMirrorDOMParser.fromSchema(schema).parse(dom.body);
}

function serialize(doc: ReturnType<typeof parse>) {
	const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
	const container = document.createElement("div");
	container.appendChild(fragment);
	return container.innerHTML;
}

function findAttachment(doc: ReturnType<typeof parse>) {
	let found: { attrs: Record<string, unknown> } | null = null;
	doc.descendants((node) => {
		if (node.type.name === "fileAttachment") found = node as never;
	});
	return found as { attrs: Record<string, unknown> } | null;
}

describe("FileAttachment node", () => {
	it("parses current markup into a single atomic node", () => {
		const doc = parse('<p><a class="document-link" href="https://example.com/a.pdf" data-type="application/pdf">Hausordnung.pdf</a></p>');
		const attachment = findAttachment(doc);

		expect(attachment).not.toBeNull();
		expect(attachment!.attrs.name).toBe("Hausordnung.pdf");
		expect(attachment!.attrs.href).toBe("https://example.com/a.pdf");
		expect(attachment!.attrs.type).toBe("application/pdf");
	});

	it("parses legacy markup that wrapped the name in a span", () => {
		const doc = parse('<p><a class="document-link" href="https://example.com/a.pdf" data-type="application/pdf">\n\t<span>Anleitung Waschmaschine.pdf</span>\n</a></p>');
		const attachment = findAttachment(doc);

		expect(attachment).not.toBeNull();
		expect(attachment!.attrs.name).toBe("Anleitung Waschmaschine.pdf");
	});

	it("is atomic, so it counts as one position in the document", () => {
		const doc = parse('<p><a class="document-link" href="https://example.com/a.pdf">Hausordnung.pdf</a></p>');
		const paragraph = doc.firstChild!;

		// One object, not one position per character of the file name.
		expect(paragraph.content.size).toBe(1);
		expect(paragraph.firstChild!.isAtom).toBe(true);
	});

	it("is a leaf: the file name is an attribute, not editable text", () => {
		const doc = parse('<p><a class="document-link" href="https://example.com/a.pdf">Hausordnung.pdf</a></p>');
		const attachmentNode = doc.firstChild!.firstChild!;

		expect(attachmentNode.isLeaf).toBe(true);
		expect(attachmentNode.childCount).toBe(0);
	});

	it("renders back to the pill markup the public pages style", () => {
		const html = serialize(parse('<p><a class="document-link" href="https://example.com/a.pdf" data-type="application/pdf">Hausordnung.pdf</a></p>'));

		expect(html).toContain('class="document-link"');
		expect(html).toContain('href="https://example.com/a.pdf"');
		expect(html).toContain('data-type="application/pdf"');
		expect(html).toContain("Hausordnung.pdf");
		expect(html).toContain('title="Hausordnung.pdf"');
	});

	it("survives a parse/render round trip unchanged", () => {
		const source = '<p><a class="document-link" href="https://example.com/a.pdf" data-type="application/pdf">Hausordnung.pdf</a></p>';
		const once = serialize(parse(source));
		const twice = serialize(parse(once));

		expect(twice).toBe(once);
	});

	it("keeps a plain link a plain link", () => {
		const doc = parse('<p><a href="https://example.com">Website</a></p>');

		expect(findAttachment(doc)).toBeNull();
	});

	it("falls back to a name when the markup has none", () => {
		const doc = parse('<p><a class="document-link" href="https://example.com/a.pdf"></a></p>');
		const attachment = findAttachment(doc);

		expect(attachment).not.toBeNull();
		expect(attachment!.attrs.name).toBeTruthy();
	});
});
