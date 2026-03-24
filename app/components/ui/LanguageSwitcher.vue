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

const currentLocaleCode = computed(() => locale.value.toUpperCase());
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
