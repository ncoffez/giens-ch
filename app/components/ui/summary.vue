<template>
	<NuxtLink 
		:to="link" 
		class="group relative flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-8 gap-y-6 my-6 md:my-8 first:mt-5 items-stretch w-full bg-white dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/10 hover:-translate-y-0.5 transition-all duration-300 md:min-h-[220px]"
	>
		<!-- Image Container -->
		<div class="relative md:w-56 w-full h-48 md:h-auto overflow-hidden rounded-xl flex-shrink-0 bg-gray-50 dark:bg-gray-800">
			<img
				:src="imageUrl"
				:alt="title"
				loading="lazy"
				class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
			/>
		</div>

		<!-- Content -->
		<div class="flex flex-col items-start gap-3 flex-1 py-1">
			<div class="flex flex-wrap items-center gap-3">
				<div class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
					<UIcon name="i-lucide-calendar" class="w-3 h-3" />
					<span>{{ date }}</span>
				</div>
				<div class="flex flex-wrap gap-2">
					<UBadge 
						v-for="label of labels" 
						:key="label" 
						color="neutral" 
						variant="subtle" 
						size="sm" 
						class="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight"
					>
						{{ label }}
					</UBadge>
				</div>
			</div>

			<div class="space-y-2 flex-1">
				<h2 class="text-lg md:text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white transition-colors duration-300">
					{{ title }}
				</h2>
				<p class="text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2 md:line-clamp-3 font-medium">
					{{ subtitle }}
				</p>
			</div>

			<div class="mt-auto pt-4 flex items-center justify-between w-full border-t border-gray-50 dark:border-gray-800/50">
				<template v-if="author">
					<div 
						@click.stop.prevent="navigateToProfile"
						class="flex items-center gap-2 group/author cursor-pointer"
					>
						<UAvatar 
							v-if="authorUid" 
							:src="undefined" 
							:alt="author" 
							size="xs" 
							class="w-6 h-6 text-[10px] ring-2 ring-gray-100 dark:ring-gray-800 group-hover/author:ring-primary/30 transition-all" 
						/>
						<span class="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover/author:text-primary transition-colors">
							{{ author }}
						</span>
					</div>
				</template>
				
				<div class="flex items-center gap-1 text-primary text-sm font-black opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
					<span>Lesen</span>
					<UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
				</div>
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
	labels?: string[];
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
