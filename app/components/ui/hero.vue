<template>
	<section
		class="relative w-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-gray-100 dark:bg-gray-800"
		:class="[height]">
		<img
			v-if="src"
			:src="src"
			:alt="alt"
			class="absolute inset-0 object-cover h-full w-full brightness-110 contrast-[90%] scale-105"
			loading="eager" />
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 md:p-12">
			<div class="text-white max-w-4xl">
				<h1 class="text-4xl md:text-7xl font-black mb-4 tracking-tighter">
					{{ title }}
				</h1>
				<p
					v-if="subtitle"
					class="text-xl md:text-2xl font-medium text-white/90 leading-snug">
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
</script>
