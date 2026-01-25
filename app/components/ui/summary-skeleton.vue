<template>
	<div class="flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-12 gap-y-8 my-16 first:mt-5 items-center w-full">
		<USkeleton
			class="md:w-56 w-full h-48 rounded-xl aspect-square"
			:class="index % 2 === 0 ? '-rotate-2' : 'rotate-2'" />
		<div class="flex flex-col items-start gap-4 flex-1 w-full">
			<USkeleton class="h-10 w-3/4" />
			<div class="space-y-2 w-full">
				<USkeleton class="h-4 w-full" />
				<USkeleton class="h-4 w-5/6" />
			</div>
			<div class="flex gap-2 items-center">
				<USkeleton class="h-4 w-20" />
				<USkeleton class="h-6 w-16 rounded-full" />
				<USkeleton class="h-6 w-16 rounded-full" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineProps({
	index: {
		type: Number,
		default: 0,
	},
});
</script>
