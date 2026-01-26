<template>
	<div class="flex flex-col items-start mb-6 md:mb-12">
		<h6 id="subtitle" class="text-sm md:text-base font-black uppercase tracking-widest text-gray-400 mb-2">{{ subtitle }}</h6>
		<div
			class="skip-ink text-3xl md:text-7xl font-black leading-tight underline underline-offset-[-15%] md:decoration-[1.3rem] decoration-[.6rem] decoration-primary/30 tracking-tighter">
			{{ title }}
		</div>
	</div>
</template>
<script lang="ts" setup>
defineProps(["title", "subtitle"]);
</script>
<style scoped></style>
