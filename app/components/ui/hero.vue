<template>
	<section
		class="relative w-full overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/20 dark:border-white/6 shadow-[0_24px_64px_rgba(20,18,14,0.12)] dark:shadow-[0_28px_84px_rgba(0,0,0,0.42)] bg-stone-100 dark:bg-stone-900"
		:class="[height || 'h-[34vh] md:h-[50vh] min-h-[260px] md:min-h-[400px]']"
	>
		<picture v-if="src" class="absolute inset-0">
			<template v-if="isExternalUrl">
				<img
					:src="src"
					:alt="alt"
					:class="imageClasses"
					loading="eager"
					fetchpriority="high" />
			</template>
			<template v-else-if="responsive">
				<source :srcset="getResponsiveImage(src, 800)" media="(max-width: 768px)" />
				<source :srcset="getResponsiveImage(src, 1200)" media="(max-width: 1200px)" />
				<img
					:src="getResponsiveImage(src, 1920)"
					:alt="alt"
					:class="imageClasses"
					loading="eager"
					fetchpriority="high" />
			</template>
			<template v-else>
				<img
					:src="src"
					:alt="alt"
					:class="imageClasses"
					loading="eager"
					fetchpriority="high" />
			</template>
		</picture>
		<div
			class="absolute inset-0 flex items-end p-5 md:p-12"
			:class="overlayClass || 'bg-[linear-gradient(180deg,rgba(7,7,7,0.1)_0%,rgba(7,7,7,0.18)_30%,rgba(7,7,7,0.72)_100%)] dark:bg-[linear-gradient(180deg,rgba(5,5,5,0.16)_0%,rgba(5,5,5,0.28)_30%,rgba(5,5,5,0.86)_100%)]'">
			<div class="text-white" :class="contentClass || 'max-w-4xl'">
				<div
					v-if="eyebrow"
					class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82 backdrop-blur-sm">
					<span class="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
					{{ eyebrow }}
				</div>
				<h1
					class="display-copy text-3xl md:text-7xl font-bold mb-2 md:mb-4 tracking-[-0.05em] leading-[0.98] text-balance"
					:class="titleClass">
					{{ title }}
				</h1>
				<p
					v-if="subtitle"
					class="text-base md:text-2xl font-medium text-white/88 leading-snug max-w-2xl text-pretty"
					:class="subtitleClass">
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
	eyebrow?: string;
	imageClass?: string;
	contentClass?: string;
	titleClass?: string;
	subtitleClass?: string;
	overlayClass?: string;
	responsive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	height: "h-[50vh] min-h-[400px]",
	alt: "",
	responsive: true,
});

const isExternalUrl = computed(() => {
	if (!props.src) return false;
	return props.src.startsWith("http://") || props.src.startsWith("https://");
});

const imageClasses = computed(() => [
	"absolute inset-0 object-cover h-full w-full brightness-[1.05] contrast-[92%] scale-100 md:scale-[1.03]",
	props.imageClass,
]);

const getResponsiveImage = (src: string | undefined, width: number): string => {
	if (!src) return "";
	return src.replace(/\.(jpg|jpeg|webp)$/i, "") + `-${width}w.webp`;
};
</script>
