<script setup lang="ts">
import { getFilePreviewKind } from "~/utils/fileTypes";

/**
 * Inline preview for a single file. The caller owns fetching the (usually signed)
 * URL and passes it in, so this works for home files, owner documents and any
 * other list without knowing which endpoint the URL came from.
 */
const props = defineProps<{
	/** Null closes the modal. */
	file: { name: string; type: string } | null;
	url: string;
	loading?: boolean;
	/** Hides the download action when the caller has no download path. */
	downloadable?: boolean;
}>();

const emit = defineEmits<{
	close: [];
	download: [];
}>();

const { t } = useI18n();

const isOpen = computed({
	get: () => props.file !== null,
	set: (open: boolean) => {
		if (!open) emit("close");
	},
});

const previewKind = computed(() => getFilePreviewKind(props.file?.type));
</script>

<template>
	<UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-4xl' }">
		<template #header>
			<div class="min-w-0">
				<p class="text-xs uppercase tracking-[0.18em] text-stone-400">{{ t("homes.files.preview.title") }}</p>
				<p class="font-semibold break-words">{{ file?.name }}</p>
			</div>
		</template>

		<template #body>
			<div class="flex min-h-64 items-center justify-center">
				<div v-if="loading" class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />

				<img
					v-else-if="previewKind === 'image'"
					:src="url"
					:alt="file?.name"
					class="max-h-[70vh] w-auto rounded-xl object-contain"
				/>

				<video v-else-if="previewKind === 'video'" :src="url" controls class="max-h-[70vh] w-full rounded-xl" />

				<audio v-else-if="previewKind === 'audio'" :src="url" controls class="w-full" />

				<iframe
					v-else-if="previewKind === 'pdf' || previewKind === 'text'"
					:src="url"
					class="h-[70vh] w-full rounded-xl border border-stone-200 dark:border-stone-700"
					:title="file?.name"
				/>

				<div v-else class="text-center space-y-3">
					<UIcon name="i-lucide-file" class="w-10 h-10 mx-auto text-stone-300" />
					<p class="text-stone-500">{{ t("homes.files.preview.unsupported") }}</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex w-full justify-end gap-2">
				<UButton
					v-if="downloadable !== false"
					variant="ghost"
					color="neutral"
					icon="i-lucide-download"
					@click="emit('download')"
				>
					{{ t("homes.files.actions.download") }}
				</UButton>
				<UButton variant="ghost" @click="emit('close')">
					{{ t("error.close") }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>
