import { Node, mergeAttributes } from "@tiptap/core";

export interface FileAttachmentAttributes {
	href: string;
	name: string;
	type: string | null;
}

/**
 * A file attachment behaves as a single object in the document, not as a run of
 * characters: it is selected, moved and deleted as a whole, and a backspace can
 * never leave half a file name behind.
 *
 * It renders as `<a class="document-link">Name.pdf</a>`, which is the markup the
 * public pages already style as a pill (see app/assets/prose.css) — so previously
 * stored attachments are picked up unchanged by `parseHTML` and upgraded to a
 * proper node the next time a page is edited.
 */
export const FileAttachment = Node.create({
	name: "fileAttachment",
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes() {
		return {
			href: { default: null },
			name: { default: "" },
			type: {
				default: null,
				parseHTML: (element) => element.getAttribute("data-type"),
				renderHTML: (attributes) => attributes.type ? { "data-type": attributes.type } : {},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "a.document-link",
				priority: 100,
				getAttrs: (element) => {
					if (!(element instanceof HTMLElement)) return false;

					return {
						href: element.getAttribute("href"),
						// Legacy markup wrapped the name in a <span>; textContent covers both.
						name: (element.textContent || "").trim() || element.getAttribute("title") || "Datei",
						type: element.getAttribute("data-type"),
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes, node }) {
		const name = (node.attrs.name as string) || "Datei";

		return [
			"a",
			mergeAttributes(HTMLAttributes, {
				class: "document-link",
				target: "_blank",
				rel: "noopener noreferrer",
				title: name,
			}),
			name,
		];
	},

	renderText({ node }) {
		return (node.attrs.name as string) || "";
	},
});

export default FileAttachment;
