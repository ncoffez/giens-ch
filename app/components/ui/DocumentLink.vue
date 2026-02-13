<script setup lang="ts">
const props = defineProps<{
	url: string;
	name?: string;
	type?: string;
	size?: number;
	showRemove?: boolean;
}>();

const emit = defineEmits<{
	remove: [];
}>();

const getFileIcon = computed(() => {
	const type = props.type || "";
	if (type.startsWith("image/")) return "i-lucide-image";
	if (type === "application/pdf") return "i-lucide-file-text";
	if (type.includes("word") || type.includes("document")) return "i-lucide-file-text";
	if (type.includes("sheet") || type.includes("excel")) return "i-lucide-spreadsheet";
	if (type.includes("presentation") || type.includes("powerpoint")) return "i-lucide-presentation";
	return "i-lucide-file";
});

const getFileColor = computed(() => {
	const type = props.type || "";
	if (type === "application/pdf") return "text-red-500";
	if (type.includes("word") || type.includes("document")) return "text-blue-500";
	if (type.includes("sheet") || type.includes("excel")) return "text-green-500";
	if (type.includes("presentation") || type.includes("powerpoint")) return "text-orange-500";
	return "text-stone-500";
});

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileName = computed(() => {
	if (props.name) return props.name;
	try {
		const url = new URL(props.url);
		const parts = url.pathname.split("/");
		return decodeURIComponent(parts[parts.length - 1] || "Download");
	} catch {
		return "Download";
	}
});
</script>

<template>
	<a
		:href="url"
		target="_blank"
		class="group flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors"
	>
		<div class="p-2 rounded-lg bg-white dark:bg-stone-900 shadow-sm">
			<UIcon :name="getFileIcon" class="w-6 h-6" :class="getFileColor" />
		</div>
		<div class="flex-1 min-w-0">
			<p class="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{{ fileName }}</p>
			<p v-if="size" class="text-xs text-stone-400">{{ formatFileSize(size) }}</p>
		</div>
		<div class="flex items-center gap-2">
			<UIcon name="i-lucide-download" class="w-4 h-4 text-stone-400 group-hover:text-primary transition-colors" />
			<button
				v-if="showRemove"
				@click.prevent.stop="emit('remove')"
				class="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-colors"
			>
				<UIcon name="i-lucide-x" class="w-4 h-4" />
			</button>
		</div>
	</a>
</template>