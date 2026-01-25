<template>
	<div class="relative bg-white dark:bg-zinc-800 rounded-lg m-2 max-w-screen-lg mx-auto shadow-glow-lg">
		<div
			class="sticky top-0 z-10 flex text-gray-800 dark:bg-white flex-wrap items-center rounded-t-lg gap-1 py-1 border-b border-gray-200 place-content-center"
			v-if="editor">
			
			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-undo"
				@click="editor.chain().focus().undo().run()"
				:disabled="!editor.can().chain().focus().undo().run()" />
			
			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-redo"
				@click="editor.chain().focus().redo().run()"
				:disabled="!editor.can().chain().focus().redo().run()" />

			<div class="separator"></div>

			<UDropdownMenu :items="headingItems" :content="{ align: 'start' }">
				<UButton
					color="neutral"
					variant="ghost"
					:icon="activeHeadingIcon"
					trailing-icon="i-lucide-chevron-down" />
			</UDropdownMenu>

			<UDropdownMenu :items="listItems" :content="{ align: 'start' }">
				<UButton
					color="neutral"
					variant="ghost"
					:icon="activeListIcon"
					trailing-icon="i-lucide-chevron-down" />
			</UDropdownMenu>

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-bold"
				@click="editor.chain().focus().toggleBold().run()"
				:class="{ 'bg-gray-200': editor.isActive('bold') }" />
			
			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-italic"
				@click="editor.chain().focus().toggleItalic().run()"
				:class="{ 'bg-gray-200': editor.isActive('italic') }" />
			
			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-strikethrough"
				@click="editor.chain().focus().toggleStrike().run()"
				:class="{ 'bg-gray-200': editor.isActive('strike') }" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-highlighter"
				@click="editor.chain().focus().toggleHighlight().run()"
				:class="{ 'bg-gray-200': editor.isActive('highlight') }" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-link"
				@click="setLink"
				:class="{ 'bg-gray-200': editor.isActive('link') }" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-remove-formatting"
				@click="editor.chain().focus().unsetAllMarks().run()" />

			<div class="separator"></div>

			<UDropdownMenu :items="alignmentItems" :content="{ align: 'start' }">
				<UButton
					color="neutral"
					variant="ghost"
					:icon="activeAlignmentIcon"
					trailing-icon="i-lucide-chevron-down" />
			</UDropdownMenu>

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-text-quote"
				@click="editor.chain().focus().toggleBlockquote().run()"
				:class="{ 'bg-gray-200': editor.isActive('blockquote') }" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-minus"
				@click="editor.chain().focus().setHorizontalRule().run()" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-image-plus"
				disabled
				label="Add" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-letter-text"
				@click="loadDemo"
				title="Demo text" />
		</div>
		<input type="file" ref="fileInput" @change="handleFileChange" style="display: none" />
		<editor-content :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, computed, type Ref } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { watchDeep } from "@vueuse/core";

const model = defineModel({ default: "<p>This is the default content.</p>" });
const fileInput = ref(null);
const editor = ref<Editor>();

const { $token } = useNuxtApp();

const loadDemo = async () => {
	try {
		const response = await $fetch<any>(`/api/randomArticle`, {
			method: "post",
			headers: $token.value ? { Authorization: `Bearer ${$token.value}` } : {},
		});
		if (response) {
			editor.value?.commands.setContent(`<h1>${response.title}</h1> ${response.body}`);
		}
	} catch (e) {
		console.error("Failed to load demo article", e);
	}
};

onMounted(() => {
	editor.value = new Editor({
		content: model.value,
		extensions: [
			StarterKit.configure({
				code: false,
				codeBlock: false,
				link: {
					openOnClick: "whenNotEditable",
					protocols: ["http", "https"],
					HTMLAttributes: {
						rel: "noopener noreferrer",
						target: "_blank",
					},
				},
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Highlight.configure({
				multicolor: true,
			}),
			Placeholder.configure({
				placeholder: "Write something...",
			}),
			Image,
			TaskList,
			TaskItem,
		],

		onUpdate: ({ editor }) => {
			model.value = editor.getHTML();
		},
		editorProps: {
			attributes: {
				class: "prose outline-none min-h-[400px] max-w-screen-md mx-auto py-12 mx-4",
			},
		},
	});
});

const headingItems = computed(() => [
	[
		{ label: "Paragraph", icon: "i-lucide-pilcrow", onSelect: () => editor.value?.chain().focus().setParagraph().run() },
		{ label: "Heading 1", icon: "i-lucide-heading-1", onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run() },
		{ label: "Heading 2", icon: "i-lucide-heading-2", onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
		{ label: "Heading 3", icon: "i-lucide-heading-3", onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run() },
		{ label: "Heading 4", icon: "i-lucide-heading-4", onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 4 }).run() },
	]
]);

const activeHeadingIcon = computed(() => {
	if (editor.value?.isActive("heading", { level: 1 })) return "i-lucide-heading-1";
	if (editor.value?.isActive("heading", { level: 2 })) return "i-lucide-heading-2";
	if (editor.value?.isActive("heading", { level: 3 })) return "i-lucide-heading-3";
	if (editor.value?.isActive("heading", { level: 4 })) return "i-lucide-heading-4";
	return "i-lucide-heading";
});

const listItems = computed(() => [
	[
		{ label: "Bullet List", icon: "i-lucide-list", onSelect: () => editor.value?.chain().focus().toggleBulletList().run() },
		{ label: "Ordered List", icon: "i-lucide-list-ordered", onSelect: () => editor.value?.chain().focus().toggleOrderedList().run() },
		{ label: "Task List", icon: "i-lucide-list-todo", onSelect: () => editor.value?.chain().focus().toggleTaskList().run() },
	]
]);

const activeListIcon = computed(() => {
	if (editor.value?.isActive("bulletList")) return "i-lucide-list";
	if (editor.value?.isActive("orderedList")) return "i-lucide-list-ordered";
	if (editor.value?.isActive("taskList")) return "i-lucide-list-todo";
	return "i-lucide-list";
});

const alignmentItems = computed(() => [
	[
		{ label: "Align Left", icon: "i-lucide-align-left", onSelect: () => editor.value?.chain().focus().setTextAlign("left").run() },
		{ label: "Align Center", icon: "i-lucide-align-center", onSelect: () => editor.value?.chain().focus().setTextAlign("center").run() },
		{ label: "Align Right", icon: "i-lucide-align-right", onSelect: () => editor.value?.chain().focus().setTextAlign("right").run() },
		{ label: "Align Justify", icon: "i-lucide-align-justify", onSelect: () => editor.value?.chain().focus().setTextAlign("justify").run() },
	]
]);

const activeAlignmentIcon = computed(() => {
	if (editor.value?.isActive({ textAlign: "center" })) return "i-lucide-align-center";
	if (editor.value?.isActive({ textAlign: "right" })) return "i-lucide-align-right";
	if (editor.value?.isActive({ textAlign: "justify" })) return "i-lucide-align-justify";
	return "i-lucide-align-left";
});

const setLink = () => {
	if (!editor.value) return;
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
.separator {
	width: 1px;
	height: 1.5rem;
	background-color: rgb(209 213 219);
	margin-left: 0.5rem;
	margin-right: 0.5rem;
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
