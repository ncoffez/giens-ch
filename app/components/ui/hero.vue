<template>
	<section class="relative w-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-stone-100 dark:bg-stone-800" :class="[height || 'h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]']">
		<picture v-if="src" class="absolute inset-0">
			<source :srcset="getResponsiveImage(src, 800)" media="(max-width: 768px)" />
			<source :srcset="getResponsiveImage(src, 1200)" media="(max-width: 1200px)" />
			<img
				:src="getResponsiveImage(src, 1920)"
				:alt="alt"
				class="absolute inset-0 object-cover h-full w-full brightness-110 contrast-[90%] scale-100 md:scale-105"
				loading="eager"
				fetchpriority="high" />
		</picture>
		<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 md:p-12">
			<div class="text-white max-w-4xl">
				<h1 class="text-3xl md:text-7xl font-black mb-2 md:mb-4 tracking-tighter leading-tight">
					{{ title }}
				</h1>
				<p v-if="subtitle" class="text-lg md:text-2xl font-medium text-white/90 leading-snug max-w-2xl">
					{{ subtitle }}
				</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
interface Props {
	title: string;
	subtitle?: string;
	src?: string;
	alt?: string;
	height?: string;
}

withDefaults(defineProps<Props>(), {
	height: "h-[50vh] min-h-[400px]",
	alt: "",
});

const getResponsiveImage = (src: string | undefined, width: number): string => {
	if (!src) return "";
	return src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
};
</script>
