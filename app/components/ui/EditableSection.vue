<script setup lang="ts">
defineProps<{
	isAdmin: boolean;
	isEditing: boolean;
	isSaving: boolean;
	status: string;
	emptyMessage?: string;
	emptySubMessage?: string;
}>();

const emit = defineEmits<{
	startEditing: [];
	cancelEditing: [];
	save: [];
}>();
</script>

<template>
	<div class="space-y-6">
		<div class="flex items-center justify-end gap-2">
			<template v-if="isAdmin && !isEditing">
				<UButton
					color="neutral"
					variant="outline"
					icon="i-lucide-edit"
					@click="emit('startEditing')"
				>
					Bearbeiten
				</UButton>
			</template>
			<template v-else-if="isEditing">
				<UButton
					color="neutral"
					variant="ghost"
					@click="emit('cancelEditing')"
					:disabled="isSaving"
				>
					Abbrechen
				</UButton>
				<UButton
					color="primary"
					icon="i-lucide-save"
					:loading="isSaving"
					@click="emit('save')"
				>
					Speichern
				</UButton>
			</template>
		</div>

		<div v-if="status === 'pending'" class="flex justify-center py-12">
			<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<slot v-else-if="isEditing" name="editor" />
		<slot v-else />

		<div
			v-if="status !== 'pending' && !isEditing && $slots.empty && !$slots.default?.()"
			class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700"
		>
			<slot name="empty" />
		</div>
	</div>
</template>
