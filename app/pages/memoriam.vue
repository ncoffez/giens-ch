<script setup lang="ts">
definePageMeta({
	middleware: ["site-permission"],
	permission: "memoriam.view",
});

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
