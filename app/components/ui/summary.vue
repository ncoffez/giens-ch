<template>
	<NuxtLink 
		:to="link" 
		class="group relative flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-8 gap-y-6 my-6 md:my-8 first:mt-5 items-stretch w-full bg-white dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/10 hover:-translate-y-0.5 transition-all duration-200"
	>
		<!-- Image Container -->
		<div class="relative w-full aspect-square md:w-44 overflow-hidden rounded-xl flex-shrink-0 bg-gray-50 dark:bg-gray-800">
			<img
				:src="imageUrl"
				:alt="title"
				loading="lazy"
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-120"
			/>
		</div>

		<!-- Content -->
		<div class="flex flex-col items-start gap-3 flex-1 py-1">
			<!-- Meta Information (Date + Author) -->
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wide">
					<UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
					<span>{{ date }}</span>
				</div>
				<template v-if="author">
					<div
						@click.stop.prevent="navigateToProfile"
						class="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 cursor-pointer group/author"
					>
						<UIcon name="i-lucide-user" class="w-3.5 h-3.5 group-hover/author:scale-110 transition-transform duration-200" />
						<span>{{ author }}</span>
					</div>
				</template>
			</div>

			<!-- Title and Subtitle -->
			<div class="space-y-2 flex-1">
				<div class="text-lg md:text-xl font-semibold leading-snug text-gray-900 dark:text-white transition-colors duration-200">
					{{ title }}
				</div>
				<div class="text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2 md:line-clamp-3">
					{{ subtitle }}
				</div>
			</div>

			<!-- Read Action -->
			<div class="flex items-center gap-1 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
				<span>Lesen</span>
				<UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
			</div>
		</div>
	</NuxtLink>
</template>

<script lang="ts" setup>
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
}>();

const navigateToProfile = () => {
	if (props.authorUid) {
		navigateTo(`/profile/${props.authorUid}`);
	}
};
</script>

<style scoped></style>
