<template>
	<NuxtLink 
		:to="link" 
		class="group relative flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-8 gap-y-6 my-6 md:my-8 first:mt-5 items-stretch w-full bg-white dark:bg-stone-900/40 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-primary/10 hover:-translate-y-0.5 transition-all duration-200"
	>
		<!-- Image Container -->
		<div class="relative w-full aspect-square md:w-44 overflow-hidden rounded-xl flex-shrink-0 bg-stone-50 dark:bg-stone-800">
			<img
				:src="imageUrl || getArticlePlaceholder(id)"
				:alt="title"
				loading="lazy"
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-120"
			/>
		</div>

		<!-- Content -->
		<div class="flex flex-col items-start gap-3 flex-1 py-1">
			<!-- Meta Information (Date + Author) -->
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wide cursor-default rounded-full px-2 py-0.5 hover:bg-neutral-200/70 dark:hover:bg-stone-700/70 transition-colors duration-200">
					<UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
					<span>{{ date }}</span>
				</div>
				<template v-if="author">
					<div
						@click.stop.prevent="navigateToProfile"
						class="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400 rounded-full px-2 py-0.5 hover:bg-neutral-200/70 dark:hover:bg-stone-700/70 transition-colors duration-200 cursor-pointer group/author"
					>
						<UIcon name="i-lucide-user" class="w-3.5 h-3.5 group-hover/author:scale-110 transition-transform duration-200" />
						<span>{{ author }}</span>
					</div>
				</template>
				<template v-if="hasAttachments">
					<div class="flex items-center gap-2 text-xs font-semibold text-primary dark:text-primary-400 rounded-full px-2 py-0.5 bg-primary/5 cursor-default">
						<UIcon name="i-lucide-paperclip" class="w-3.5 h-3.5" />
						<span class="hidden sm:inline">Dokumente</span>
					</div>
				</template>
			</div>

			<!-- Title and Subtitle -->
			<div class="flex flex-col gap-2 flex-1">
				<!-- Lock icon indicator -->
				<div v-if="locked" class="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
					<UIcon name="i-lucide-lock" class="w-3 h-3" />
					<span>Gesperrt</span>
				</div>

				<div class="space-y-2 flex-1">
					<div class="text-lg md:text-xl font-semibold leading-snug text-gray-900 dark:text-white transition-colors duration-200">
						{{ title }}
					</div>
					<div class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-2 md:line-clamp-3">
						{{ subtitle }}
					</div>
				</div>
			</div>

			<!-- Read Action -->
			<div class="flex items-center gap-1 text-primary text-sm font-bold opacity-60 -translate-x-2 transition-all duration-200 rounded-full px-2 py-0.5 hover:opacity-100 hover:bg-primary/5 hover:text-primary/80 hover:translate-x-0 cursor-pointer group-read">
				<span>Lesen</span>
				<UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
			</div>
		</div>
	</NuxtLink>
</template>

<script lang="ts" setup>
import { getArticlePlaceholder } from "~/utils/placeholders";

const localePath = useLocalePath();

const props = defineProps<{
  link: string;
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  date: string;
  author?: string;
  authorUid?: string;
  index?: number;
  locked?: boolean;
  hasAttachments?: boolean;
}>();

const navigateToProfile = () => {
  if (props.authorUid) {
    navigateTo(localePath(`/profile/${props.authorUid}`));
  }
};
</script>

<style scoped></style>
