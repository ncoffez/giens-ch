<script lang="ts" setup>
const i18n = useI18n();
const nuxtApp = useNuxtApp();
const restoreScrollKey = "language-switch-scroll";

function readSavedScrollPosition() {
	if (!import.meta.client) {
		return null;
	}

	const savedValue = sessionStorage.getItem(restoreScrollKey);

	if (!savedValue) {
		return null;
	}

	try {
		const { scrollY } = JSON.parse(savedValue) as { scrollY?: number };
		return typeof scrollY === "number" ? scrollY : 0;
	} catch {
		return 0;
	}
}

function clearSavedScrollPosition() {
	if (!import.meta.client) {
		return;
	}

	sessionStorage.removeItem(restoreScrollKey);
}

function restoreScrollPosition() {
	if (!import.meta.client) {
		return;
	}

	const top = readSavedScrollPosition();

	if (top === null) {
		return;
	}

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			window.scrollTo({ top, behavior: "auto" });
			clearSavedScrollPosition();
		});
	});
}

async function changeLocale(code: string) {
	if (code === i18n.locale?.value) {
		return;
	}

	if (import.meta.client) {
		sessionStorage.setItem(restoreScrollKey, JSON.stringify({
			scrollY: window.scrollY,
		}));
	}

	nuxtApp.hooks.hookOnce("page:finish", () => {
		restoreScrollPosition();
	});

	await i18n.setLocale(code);
}

const localeItems = computed(() => {
	const localesList = Array.isArray(i18n.locales?.value)
		? i18n.locales.value as { code: string; name: string }[]
		: [];

	return [
		localesList.map((l) => ({
			label: l.name,
			onSelect: () => {
				return changeLocale(l.code);
			},
		})),
	];
});

const currentLocaleCode = computed(() => (i18n.locale?.value || "de").toUpperCase());

onMounted(() => {
	restoreScrollPosition();
});
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
