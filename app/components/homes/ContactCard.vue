<script setup lang="ts">
import type { HomeContact } from "~/types";

interface Props {
	contact: HomeContact;
	showHiddenBadge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	showHiddenBadge: false,
});
</script>

<template>
	<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
		<div class="flex items-start gap-4">
			<NuxtLink
				v-if="contact.isOwner"
				:to="`/profile/${contact.id.replace('owner-', '')}`"
				class="shrink-0 hover:opacity-80 transition-opacity"
			>
				<UAvatar
					:src="contact.avatar"
					:alt="contact.name"
					size="xl"
					class="ring-2 ring-stone-100 dark:ring-stone-700"
				/>
			</NuxtLink>
			<UAvatar
				v-else
				:src="contact.avatar"
				:alt="contact.name"
				size="xl"
				class="ring-2 ring-stone-100 dark:ring-stone-700"
			/>

			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<NuxtLink
						v-if="contact.isOwner"
						:to="`/profile/${contact.id.replace('owner-', '')}`"
						class="font-medium hover:text-primary transition-colors"
					>
						{{ contact.name }}
					</NuxtLink>
					<p v-else class="font-medium">{{ contact.name }}</p>
					
					<span v-if="contact.isOwner" class="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
						Eigentümer
					</span>
					<span v-else-if="showHiddenBadge && contact.hidden" class="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 px-2 py-0.5 rounded-full">
						Versteckt
					</span>
				</div>

				<p v-if="contact.notes" class="text-sm text-stone-500 mt-1">{{ contact.notes }}</p>

				<div v-if="contact.email || contact.phone" class="mt-2 space-y-1">
					<a
						v-if="contact.email"
						:href="`mailto:${contact.email}`"
						class="flex items-center gap-2 text-sm text-stone-500 hover:text-primary transition-colors"
					>
						<UIcon name="i-lucide-mail" class="w-4 h-4" />
						{{ contact.email }}
					</a>
					<a
						v-if="contact.phone"
						:href="`tel:${contact.phone}`"
						class="flex items-center gap-2 text-sm text-stone-500 hover:text-primary transition-colors"
					>
						<UIcon name="i-lucide-phone" class="w-4 h-4" />
						{{ contact.phone }}
					</a>
				</div>
			</div>
		</div>
	</div>
</template>
