<script lang="ts" setup>
const { locale, locales, setLocale } = useI18n();

const localeItems = computed(() => {
	const localesList = locales.value as { code: string; name: string }[];
	return [
		localesList.map((l) => ({
			label: l.name,
			icon: locale.value === l.code ? "i-lucide-check" : undefined,
			onSelect: () => {
				setLocale(l.code);
			},
		})),
	];
});

const currentLocaleName = computed(() => {
	const localesList = locales.value as { code: string; name: string }[];
	return localesList.find((l) => l.code === locale.value)?.name || locale.value.toUpperCase();
});
</script>

<template>
	<UDropdownMenu :items="localeItems" :ui="{ content: 'w-32' }">
		<UButton
			color="neutral"
			variant="ghost"
			class="rounded-full font-bold px-2 md:px-3"
		>
			{{ currentLocaleName }}
		</UButton>
	</UDropdownMenu>
</template>
