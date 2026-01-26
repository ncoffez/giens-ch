<template>
	<div id="parent" class="flex justify-center h-fit py-8 overflow-hidden">
		<div class="flex flex-row items-center justify-center lg:gap-8 gap-4 w-[140%] md:w-[110%] rounded-xl h-fit">
			<div v-for="image of images" class="w-48 md:w-80 lg:aspect-[3/5] aspect-[3/4] rounded-xl overflow-clip rotate-2 md:rotate-3 first:hidden md:first:block last:hidden md:last:block">
				<img :src="image" class="w-full h-full object-cover saturate-[70%] brightness-110 contrast-[90%]" />
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
const images = ref([
	"/slides/porquerolle-1.jpg",
	"/slides/hyeres-1.jpg",
	"/slides/hyeres-2.jpg",
	"/slides/porquerolle-2.jpg",
	"/slides/kite-1.jpg",
]);
</script>
<style scoped></style>
