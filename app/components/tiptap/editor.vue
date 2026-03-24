<template>
	<div
		class="relative bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-100 dark:border-stone-700"
		:class="{ 'ring-2 ring-primary ring-offset-2': isDragging }"
		@dragover.prevent="isDragging = true"
		@dragleave.prevent="isDragging = false"
		@drop.prevent="handleDrop"
	>
		<div
		class="sticky top-0 z-10 flex text-gray-800 dark:text-gray-200 dark:bg-stone-800 flex-wrap items-center rounded-t-lg gap-1 py-1 border-b border-stone-200 dark:border-stone-700 place-content-center"
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
				icon="i-lucide-file-up"
				@click="triggerFileUpload"
				:loading="uploading"
				:label="t('editor.upload')" />

			<UButton
				color="neutral"
				variant="ghost"
				icon="i-lucide-letter-text"
				@click="loadDemo"
				:title="t('editor.demoText')" />
		</div>
		<div
			v-if="uploading"
			class="px-4 py-2 bg-stone-50 dark:bg-zinc-900 border-b border-gray-200">
			<UProgress :value="uploadProgress" color="primary" size="sm" />
			<p class="text-xs text-stone-500 mt-1">{{ t("editor.uploading") }}</p>
		</div>
		
		<!-- Drag overlay -->
		<div
			v-if="isDragging && !uploading"
			class="absolute inset-0 bg-primary/5 dark:bg-primary/10 flex items-center justify-center z-20 pointer-events-none"
		>
			<div class="text-center">
				<UIcon name="i-lucide-file-up" class="w-12 h-12 text-primary mx-auto mb-2" />
				<p class="text-primary font-medium">{{ t("editor.dropFile") }}</p>
			</div>
		</div>
		
		<input type="file" ref="fileInput" @change="handleFileChange" style="display: none" />
		<editor-content :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, computed } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { watchDeep } from "@vueuse/core";

const model = defineModel({ default: "" });
const fileInput = ref<HTMLInputElement | null>(null);
const editor = ref<Editor>();
const uploading = ref(false);
const uploadProgress = ref(0);
const isDragging = ref(false);

const { token } = useAuthReady();
const toast = useAppToast();
const { t } = useI18n();

const triggerFileUpload = () => {
	fileInput.value?.click();
};

const processFile = async (file: File) => {
	uploading.value = true;
	uploadProgress.value = 10;

	try {
		const reader = new FileReader();
		const base64Promise = new Promise<string>((resolve) => {
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.readAsDataURL(file);
		});

		const base64 = await base64Promise;
		uploadProgress.value = 40;

		const response = await $fetch<any>("/api/editor/upload", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				filename: file.name,
				file: base64,
				type: file.type,
			},
		});

		uploadProgress.value = 90;

		if (file.type.startsWith("image/")) {
			editor.value
				?.chain()
				.focus()
				.setImage({ src: response.url, alt: response.filename })
				.run();
		} else {
			const html = `<a href="${response.url}" target="_blank" rel="noopener noreferrer" class="document-link" data-type="${file.type}">
				<span>${file.name}</span>
			</a>`;
			editor.value?.chain().focus().insertContent(html).run();
		}

		uploadProgress.value = 100;
	} catch (e: unknown) {
		console.error("Upload failed", e);
		const message = getFetchError(e) || t("editor.unknownError");
		toast.error(t("editor.uploadFailed"), message);
	} finally {
		setTimeout(() => {
			uploading.value = false;
			uploadProgress.value = 0;
		}, 500);
		if (fileInput.value) fileInput.value.value = "";
	}
};

const handleFileChange = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;
	await processFile(file);
};

const handleDrop = async (event: DragEvent) => {
	isDragging.value = false;
	const file = event.dataTransfer?.files[0];
	if (!file) return;
	await processFile(file);
};

const loadDemo = async () => {
	try {
		const response = await $fetch<any>(`/api/randomArticle`, {
			method: "post",
			headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
		});
		if (response) {
			editor.value?.commands.setContent(`<h1>${response.title}</h1> ${response.body}`);
		}
	} catch (e: unknown) {
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
				link: false,
			}),
			Link.configure({
				openOnClick: "whenNotEditable",
				protocols: ["http", "https"],
				HTMLAttributes: {
					rel: "noopener noreferrer",
					target: "_blank",
				},
			}).extend({
				addAttributes() {
					return {
						...this.parent?.(),
						class: {
							default: null,
						},
						"data-type": {
							default: null,
						},
					};
				},
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Highlight.configure({
				multicolor: true,
			}),
			Placeholder.configure({
				placeholder: t("editor.placeholder"),
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
				class: "prose outline-none min-h-[400px] max-w-screen-md mx-auto py-12 px-4",
			},
		},
	});
});

const headingItems = computed(() => [
	[
		{
			label: "Paragraph",
			icon: "i-lucide-pilcrow",
			onSelect: () => editor.value?.chain().focus().setParagraph().run(),
		},
		{
			label: "Heading 1",
			icon: "i-lucide-heading-1",
			onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
		},
		{
			label: "Heading 2",
			icon: "i-lucide-heading-2",
			onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
		},
		{
			label: "Heading 3",
			icon: "i-lucide-heading-3",
			onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
		},
		{
			label: "Heading 4",
			icon: "i-lucide-heading-4",
			onSelect: () => editor.value?.chain().focus().toggleHeading({ level: 4 }).run(),
		},
	],
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
		{
			label: "Bullet List",
			icon: "i-lucide-list",
			onSelect: () => editor.value?.chain().focus().toggleBulletList().run(),
		},
		{
			label: "Ordered List",
			icon: "i-lucide-list-ordered",
			onSelect: () => editor.value?.chain().focus().toggleOrderedList().run(),
		},
		{
			label: "Task List",
			icon: "i-lucide-list-todo",
			onSelect: () => editor.value?.chain().focus().toggleTaskList().run(),
		},
	],
]);

const activeListIcon = computed(() => {
	if (editor.value?.isActive("bulletList")) return "i-lucide-list";
	if (editor.value?.isActive("orderedList")) return "i-lucide-list-ordered";
	if (editor.value?.isActive("taskList")) return "i-lucide-list-todo";
	return "i-lucide-list";
});

const alignmentItems = computed(() => [
	[
		{
			label: "Align Left",
			icon: "i-lucide-align-left",
			onSelect: () => editor.value?.chain().focus().setTextAlign("left").run(),
		},
		{
			label: "Align Center",
			icon: "i-lucide-align-center",
			onSelect: () => editor.value?.chain().focus().setTextAlign("center").run(),
		},
		{
			label: "Align Right",
			icon: "i-lucide-align-right",
			onSelect: () => editor.value?.chain().focus().setTextAlign("right").run(),
		},
		{
			label: "Align Justify",
			icon: "i-lucide-align-justify",
			onSelect: () => editor.value?.chain().focus().setTextAlign("justify").run(),
		},
	],
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
	if (url === "") {
		editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
		return;
	}
	editor.value.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
};

watchDeep(model, (newValue: string) => {
	if (editor.value && (editor.value.getHTML() as String) == newValue) return;
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
