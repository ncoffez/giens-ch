<template>
	<div id="parent" class="flex justify-center h-fit py-8 overflow-hidden">
		<div class="flex flex-row items-center justify-center lg:gap-8 gap-4 w-[140%] md:w-[110%] rounded-xl h-fit">
			<div v-for="(image, index) of images" :key="image" class="w-48 md:w-80 lg:aspect-[3/5] aspect-[3/4] rounded-xl overflow-clip rotate-2 md:rotate-3 first:hidden md:first:block last:hidden md:last:block">
				<img :src="image" :alt="`Bild von Gard du Giens ${index + 1}`" loading="lazy" class="w-full h-full object-cover saturate-[70%] brightness-110 contrast-[90%]" width="320" height="427" />
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
const images = ref([
	"/slides/slidesporquerolle-1.webp",
	"/slides/slideshyeres-1.webp",
	"/slides/slideshyeres-2.webp",
	"/slides/slidesporquerolle-2.webp",
	"/slides/slideskite-1.webp",
]);
</script>
<style scoped></style>
