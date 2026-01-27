<template>
	<div id="news-entry" class="flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-12 gap-y-6 my-10 md:my-16 first:mt-5 items-center w-full">
		<img
			:src="imageUrl"
			:alt="title"
			loading="lazy"
			class="md:w-56 w-full h-56 md:h-48 rounded-2xl md:rounded-xl aspect-[16/9] md:aspect-square object-cover"
			:class="index % 2 === 0 ? 'md:-rotate-2' : 'md:rotate-2'" />
		<div class="flex flex-col items-start gap-3 md:gap-4 flex-1 w-full">
			<NuxtLink :to="link" class="w-full">
				<h2 class="text-2xl md:text-4xl font-bold md:font-semibold leading-tight tracking-tight">{{ title }}</h2>
			</NuxtLink>
			<p class="text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3 md:line-clamp-none">{{ subtitle }}</p>
			<div class="flex flex-wrap items-center gap-3">
				<div class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm md:text-base font-bold uppercase tracking-wider whitespace-nowrap">
					<span>{{ date }}</span>
					<template v-if="author">
						<span class="w-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full"></span>
						<span>{{ author }}</span>
					</template>
				</div>
				<div class="flex flex-wrap gap-2">
					<UBadge color="neutral" variant="subtle" v-for="label of labels" :key="label" size="sm" class="rounded-full px-2 font-bold">{{ label }}</UBadge>
				</div>
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
defineProps({
	link: {
		type: String,
		required: true,
	},
	id: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	subtitle: {
		type: String,
		required: true,
	},
	imageUrl: {
		type: String,
		required: true,
	},
	labels: {
		type: Array,
		required: false,
	},
	date: {
		type: String,
		required: true,
	},
	author: {
		type: String,
		required: false,
	},
	index: {
		type: Number,
		required: false,
		default: 0,
	},
});
</script>
<style scoped></style>
