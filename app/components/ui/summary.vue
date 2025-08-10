<template>
	<div id="news-entry" class="flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-12 gap-y-8 my-8 first:mt-5 items-center">
		<img
			:src="imageUrl"
			class="md:w-56 w-full h-48 rounded-xl aspect-square object-cover"
			alt=""
			:class="index % 2 === 0 ? '-rotate-2' : 'rotate-2'" />
		<div class="flex flex-col items-start gap-2">
			<NuxtLink :to="link">
				<h2 class="md:text-4xl text-2xl font-semibold leading-tight">{{ title }}</h2>
			</NuxtLink>
			<p class="text-base leading-relaxed">{{ subtitle }}</p>
			<div class="flex flex-wrap gap-2 items-center align-middle">
				<h6 class="text-neutral-500 dark:text-neutral-400 text-base">{{ date }}</h6>
				<UBadge color="primary" variant="solid" v-for="label of labels">{{ label }}</UBadge>
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
