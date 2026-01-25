<template>
	<div class="flex flex-col items-start text-2xl mb-12">
		<h2 id="subtitle" class="text-2xl font-">{{ subtitle }}</h2>
		<div
			class="skip-ink md:text-7xl text-3xl font-bold leading-tight underline underline-offset-[-15%] md:decoration-[1.3rem] decoration-[.6rem] decoration-primary/30">
			{{ title }}
		</div>
	</div>
</template>
<script lang="ts" setup>
defineProps(["title", "subtitle"]);
</script>
<style scoped></style>
