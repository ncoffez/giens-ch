<template>
	<div class="relative bg-white dark:bg-zinc-800 rounded-lg m-2 max-w-screen-lg mx-auto shadow-glow-lg">
		<div
			class="sticky top-0 z-10 flex text-gray-800 dark:bg-white flex-wrap items-center rounded-t-lg gap-1 py-1 border-b border-gray-200 place-content-center"
			v-if="editor">
			<button
				title="Undo"
				@click="editor.chain().focus().undo().run()"
				:disabled="!editor.can().chain().focus().undo().run()">
				<IconsLucideUndo />
			</button>
			<button
				title="Redo"
				@click="editor.chain().focus().redo().run()"
				:disabled="!editor.can().chain().focus().redo().run()">
				<IconsLucideRedo />
			</button>
			<div class="separator"></div>
			<div class="relative">
				<button
					title="Headings"
					@click="dropdownOpen = !dropdownOpen"
					ref="headingDropdownButton"
					:class="{ 'is-active': checkActiveStyle('heading') }">
					<IconsLucideHeading1 v-if="checkActiveStyle('heading', { level: 1 })" />
					<IconsLucideHeading2 v-else-if="checkActiveStyle('heading', { level: 2 })" />
					<IconsLucideHeading3 v-else-if="checkActiveStyle('heading', { level: 3 })" />
					<IconsLucideHeading4 v-else-if="checkActiveStyle('heading', { level: 4 })" />
					<IconsLucideHeading5 v-else-if="checkActiveStyle('heading', { level: 5 })" />
					<IconsLucideHeading6 v-else-if="checkActiveStyle('heading', { level: 6 })" />
					<IconsLucideHeading v-else />
				</button>
				<div
					v-if="dropdownOpen"
					ref="headingDropdown"
					class="absolute top-full mt-1 left-0 bg-white shadow-glow rounded-md flex flex-col *:rounded-none *:p-2 hover:*:bg-gray-100 *:z-10">
					<button
						@click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
						:class="checkActiveStyle('heading', { level: 1 })">
						<IconsLucideHeading1 />
					</button>
					<button
						@click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
						:class="checkActiveStyle('heading', { level: 2 })">
						<IconsLucideHeading2 />
					</button>
					<button
						@click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
						:class="checkActiveStyle('heading', { level: 3 })">
						<IconsLucideHeading3 />
					</button>
					<button
						@click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
						:class="checkActiveStyle('heading', { level: 4 })">
						<IconsLucideHeading4 />
					</button>
					<button
						@click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
						:class="checkActiveStyle('heading', { level: 5 })">
						<IconsLucideHeading5 />
					</button>
					<button
						@click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
						:class="checkActiveStyle('heading', { level: 6 })">
						<IconsLucideHeading6 />
					</button>
				</div>
			</div>
			<div class="relative">
				<button
					class="flex items-center"
					@click="listDropdownOpen = !listDropdownOpen"
					ref="listDropdownButton"
					title="Lists"
					:class="checkActiveStyle('bulletList') || checkActiveStyle('orderedList') || checkActiveStyle('taskList')">
					<IconsLucideListOrdered v-if="checkActiveStyle('orderedList')" />
					<IconsLucideListTodo v-else-if="checkActiveStyle('taskList')" />
					<IconsLucideList v-else />
				</button>
				<div
					v-if="listDropdownOpen"
					ref="listDropdown"
					class="absolute top-full left-0 bg-white rounded-md shadow-glow flex flex-col">
					<button
						@click="editor.chain().focus().toggleBulletList().run()"
						:class="checkActiveStyle('bulletList')"
						title="Bullet list">
						<IconsLucideList />
					</button>
					<button
						@click="editor.chain().focus().toggleOrderedList().run()"
						:class="checkActiveStyle('orderedList')"
						title="Ordered list">
						<IconsLucideListOrdered />
					</button>
					<button
						@click="editor.chain().focus().toggleTaskList().run()"
						:class="checkActiveStyle('taskList')"
						title="Task list">
						<IconsLucideListTodo />
					</button>
				</div>
			</div>
			<button @click="editor.chain().focus().toggleBold().run()" :class="checkActiveStyle('bold')" title="Bold">
				<IconsLucideBold />
			</button>
			<button @click="editor.chain().focus().toggleItalic().run()" :class="checkActiveStyle('italic')" title="Italic">
				<IconsLucideItalic />
			</button>
			<button
				@click="editor.chain().focus().toggleStrike().run()"
				:class="checkActiveStyle('strike')"
				title="Strikethrough">
				<IconsLucideStrikethrough />
			</button>
			<button
				@click="editor.chain().focus().toggleHighlight().run()"
				:class="checkActiveStyle('highlight')"
				title="Highlight">
				<IconsLucideHighlighter />
			</button>
			<button @click="setLink" :class="checkActiveStyle('link')" title="Link"><IconsLucideLink /></button>
			<button @click="editor.chain().focus().unsetAllMarks().run()" title="Clear formatting">
				<IconsLucideRemoveFormatting />
			</button>
			<div class="separator"></div>
			<div class="relative">
				<button
					class="flex"
					@click="alignmentDropdownOpen = !alignmentDropdownOpen"
					ref="alignmentDropdownButton"
					title="Alignment"
					:class="
						checkActiveStyle(null, { textAlign: 'center' }) ||
						checkActiveStyle(null, { textAlign: 'right' }) ||
						checkActiveStyle(null, { textAlign: 'justify' })
					">
					<IconsLucideAlignCenter v-if="checkActiveStyle(null, { textAlign: 'center' })" />
					<IconsLucideAlignRight v-else-if="checkActiveStyle(null, { textAlign: 'right' })" />
					<IconsLucideAlignJustify v-else-if="checkActiveStyle(null, { textAlign: 'justify' })" />
					<IconsLucideAlignLeft v-else />
				</button>
				<div
					v-if="alignmentDropdownOpen"
					ref="alignmentDropdown"
					class="absolute top-full left-0 bg-white rounded-md shadow-glow flex flex-row">
					<button
						@click="editor.chain().focus().setTextAlign('left').run()"
						:class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
						title="Align left">
						<IconsLucideAlignLeft />
					</button>
					<button
						@click="editor.chain().focus().setTextAlign('center').run()"
						:class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
						title="Align center">
						<IconsLucideAlignCenter />
					</button>
					<button
						@click="editor.chain().focus().setTextAlign('right').run()"
						:class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
						title="Align right">
						<IconsLucideAlignRight />
					</button>
					<button
						@click="editor.chain().focus().setTextAlign('justify').run()"
						:class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
						title="Align justify">
						<IconsLucideAlignJustify />
					</button>
				</div>
			</div>
			<button
				@click="editor.chain().focus().toggleBlockquote().run()"
				:class="checkActiveStyle('blockquote')"
				title="Blockquote">
				<IconsLucideTextQuote />
			</button>
			<button @click="editor.chain().focus().setHorizontalRule().run()" title="Horizontal rule">
				<IconsLucideMinus />
			</button>
			<button @click="addImage" disabled title="Add image" class="inline-flex font-light text-xs gap-1">
				<IconsLucideImagePlus /> Add
			</button>
			<button
				@click="
					if (demoArticle) {
						editor.commands.setContent(`<h1>${demoArticle.title}</h1> ${demoArticle.body}`);
						refresh();
					}
				"
				title="Demo text">
				<IconsLucideLetterText />
			</button>
		</div>
		<input type="file" ref="fileInput" @change="handleFileChange" style="display: none" />
		<editor-content :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { onClickOutside, watchDeep } from "@vueuse/core";
import type { Level } from "@tiptap/extension-heading";
import { IconsLucideLetterText } from "#components";

const model = defineModel({ default: "<p>This is the default content.</p>" });
const fileInput = ref(null);
const editor: Ref<Editor | undefined> = ref(undefined);

const {
	data: demoArticle,
	error,
	refresh,
} = await useLazyFetch(`/api/randomArticle`, {
	method: "post",
	body: { label: "private" },
});

// #region Dropdown handlers
const dropdownOpen = ref(false);
const listDropdownOpen = ref(false);
const alignmentDropdownOpen = ref(false);

const headingDropdown = useTemplateRef<HTMLElement>("headingDropdown");
const listDropdown = useTemplateRef<HTMLElement>("listDropdown");
const alignmentDropdown = useTemplateRef<HTMLElement>("alignmentDropdown");

const headingDropdownButton = useTemplateRef<HTMLButtonElement>("headingDropdownButton");
const listDropdownButton = useTemplateRef<HTMLButtonElement>("listDropdownButton");
const alignmentDropdownButton = useTemplateRef<HTMLButtonElement>("alignmentDropdownButton");

onClickOutside(headingDropdown, () => (dropdownOpen.value = false), { ignore: [headingDropdownButton] });
onClickOutside(listDropdown, () => (listDropdownOpen.value = false), { ignore: [listDropdownButton] });
onClickOutside(alignmentDropdown, () => (alignmentDropdownOpen.value = false), { ignore: [alignmentDropdownButton] });
// #endregion

onMounted(() => {
	editor.value = new Editor({
		content: model.value,
		extensions: [
			StarterKit.configure({
				code: false,
				codeBlock: false,
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Link.configure({
				openOnClick: "whenNotEditable",
				protocols: ["http", "https"],
				HTMLAttributes: {
					rel: "noopener noreferrer",
					target: "_blank",
				},
			}),
			Highlight.configure({
				multicolor: true,
			}),
			Placeholder.configure({
				placeholder: "Write something...",
			}),
			// Image,
			TaskList,
			TaskItem,
		],
		onUpdate: ({ editor }) => {
			model.value = editor.getHTML();
			dropdownOpen.value = false;
			listDropdownOpen.value = false;
			alignmentDropdownOpen.value = false;
		},
		editorProps: {
			attributes: {
				class: "prose outline-none min-h-[400px] max-w-screen-md mx-auto py-12 mx-4",
			},
		},
	});
});

const checkActiveStyle = (name: string | null, attributes?: Record<string, any>): string => {
	if (!editor.value) return "";
	if (!name && !attributes) return "";
	if (editor.value.isActive(name || "", attributes || undefined)) return "is-active";
	return "";
};

const selectHeading = (level: Level) => {
	if (editor.value == null) return;
	editor.value.chain().focus().toggleHeading({ level: level }).run();
};

const setLink = () => {
	if (editor.value == null) return;
	const previousUrl = editor.value.getAttributes("link").href;
	const url = window.prompt("URL", previousUrl);

	if (url === null) return;
	if (url === "") return editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
	editor.value.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
};

watchDeep(model, (newValue) => {
	if (editor.value && editor.value.getHTML() === newValue) return;
	if (editor.value) {
		editor.value.commands.setContent(newValue, { errorOnInvalidContent: true });
	}
});

onBeforeUnmount(() => {
	if (editor.value) editor.value.destroy();
});
</script>

<style scoped>
button {
	padding: 0.5rem;
	margin-left: 0.25rem;
	margin-right: 0.25rem;
	margin-top: 0rem;
	margin-bottom: 0rem;
	border-radius: 0.5rem;
	transition-duration: 200ms;
	background-color: transparent;
	color: rgb(31 41 55); /* text-gray-800 */
}

button:disabled {
	color: rgb(209 213 219); /* text-gray-300 */
	background-color: transparent;
}

button:hover {
	background-color: rgb(229 231 235); /* bg-gray-200 */
}

button.is-active {
	background-color: rgb(229 231 235); /* bg-gray-200 */
}

.separator {
	width: 1px;
	height: 1.5rem;
	background-color: rgb(209 213 219); /* bg-gray-300 */
	margin-left: 0.5rem;
	margin-right: 0.5rem;
}

.dropdown-toggle {
	display: flex;
	align-items: center;
}
</style>

<style>
.tiptap p.is-editor-empty:first-child::before {
	color: var(--text-muted);
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}
</style>
