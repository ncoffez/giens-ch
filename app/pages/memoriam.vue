<script setup lang="ts">
definePageMeta({ middleware: ["is-owner"] });

const { t } = useI18n();

useHead({
	title: t("memoriam.title"),
});
</script>

<template>
	<div class="py-16 md:py-24">
		<ClientOnly>
			<MemoriamSection />
		</ClientOnly>
	</div>
</template>
