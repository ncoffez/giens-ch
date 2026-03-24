<script setup lang="ts">
interface Props {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	confirmLabel: "Bestätigen",
	cancelLabel: "Abbrechen",
	destructive: false,
	loading: false,
});

const emit = defineEmits<{
	confirm: [];
	cancel: [];
}>();

const open = defineModel<boolean>("open", { default: false });

function handleConfirm() {
	emit("confirm");
}

function handleCancel() {
	emit("cancel");
	open.value = false;
}
</script>

<template>
	<UModal v-model:open="open" :ui="{ content: 'sm:max-w-md' }">
		<template #content>
			<div class="p-6">
				<div class="flex items-start gap-4">
					<div
						class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
						:class="destructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'"
					>
						<UIcon
							:name="destructive ? 'i-lucide-trash-2' : 'i-lucide-alert-circle'"
							class="w-5 h-5"
							:class="destructive ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
							{{ title }}
						</h3>
						<p v-if="message" class="mt-2 text-sm text-stone-500 dark:text-stone-400">
							{{ message }}
						</p>
					</div>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<UButton
						variant="ghost"
						color="neutral"
						:disabled="loading"
						@click="handleCancel"
					>
						{{ cancelLabel }}
					</UButton>
					<UButton
						:color="destructive ? 'error' : 'primary'"
						:loading="loading"
						@click="handleConfirm"
					>
						{{ confirmLabel }}
					</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>
