<script lang="ts" setup>
const i18n = useI18n();

const localeItems = computed(() => {
	const localesList = Array.isArray(i18n.locales?.value)
		? i18n.locales.value as { code: string; name: string }[]
		: [];

	return [
		localesList.map((l) => ({
			label: l.name,
			onSelect: () => {
				return i18n.setLocale(l.code);
			},
		})),
	];
});

const currentLocaleCode = computed(() => (i18n.locale?.value || "de").toUpperCase());
</script>

<template>
	<UDropdownMenu :items="localeItems" :ui="{ content: 'w-32' }">
		<UButton
			color="neutral"
			variant="ghost"
			class="rounded-full font-bold px-2 md:px-3 tracking-[0.18em]"
		>
			{{ currentLocaleCode }}
		</UButton>
	</UDropdownMenu>
</template>
