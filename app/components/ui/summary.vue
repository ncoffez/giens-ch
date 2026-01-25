<template>
	<div id="news-entry" class="flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-12 gap-y-8 my-16 first:mt-5 items-center w-full">
		<img
			:src="imageUrl"
			class="md:w-56 w-full h-48 rounded-xl aspect-square object-cover"
			alt=""
			:class="index % 2 === 0 ? '-rotate-2' : 'rotate-2'" />
		<div class="flex flex-col items-start gap-4 flex-1 w-full">
			<NuxtLink :to="link" class="w-full">
				<h2 class="md:text-4xl text-2xl font-semibold leading-tight">{{ title }}</h2>
			</NuxtLink>
			<p class="text-base leading-relaxed text-gray-600 dark:text-gray-400">{{ subtitle }}</p>
			<div class="flex gap-2 items-center">
				<h6 class="text-neutral-500 dark:text-neutral-400 text-base whitespace-nowrap">{{ date }}</h6>
				<div class="flex flex-wrap gap-2">
					<UBadge color="primary" variant="solid" v-for="label of labels" :key="label" size="sm" class="rounded-full px-2">{{ label }}</UBadge>
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
	index: {
		type: Number,
		required: false,
		default: 0,
	},
});
</script>
<style scoped></style>
