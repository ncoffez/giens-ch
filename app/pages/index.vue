<template>
	<div class="gap-24 flex flex-col mb-20">
		<UiHero
			title="Willkommen im Beausoleil"
			subtitle="Ihre Oase auf der Halbinsel Giens – seit über 30 Jahren."
			src="/giens/hauseingang_cropped.jpg"
			alt="Einfahrt"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<section class="max-w-screen-xl mx-auto w-full px-4">
			<UiTitle subtitle="Was uns auszeichnet" title="Wohlfühlen und Erleben" />
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-8 md:mt-12">
				<div class="p-6 md:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-home" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Wohnkomfort</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Jedes Haus verfügt über eine gedeckte Terrasse (Patio) und einen privaten Parkplatz direkt vor der Tür.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-bike" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Gemeinschaftsgut</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Fahrräder, Spielzeug und eine Bibliothek (DE/FR) stehen allen Bewohnern zur freien Nutzung zur Verfügung.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-washing-machine" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Praktisch</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Zentrale Waschmaschinen und ein grosszügiger Bereich zum Wäschetrocknen im grünen Garten.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-green-600 dark:text-green-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-leaf" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Natur pur</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Die Siedlung ist reich bepflanzt und bietet schattige Plätze sowie eine ruhige, entspannte Atmosphäre.
					</p>
				</div>
			</div>
		</section>

		<section class="bg-gray-50 dark:bg-gray-900/50 py-12 md:py-24 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden relative shadow-sm">
			<div class="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
				<div class="space-y-6 md:space-y-8 text-center md:text-left">
					<h2 class="text-3xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">Miteinander Gestalten</h2>
					<p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
						Zweimal im Jahr treffen wir uns als Gemeinschaft, um die Siedlung zu pflegen und neue Projekte umzusetzen. Dieser Hands-on-Spirit macht das Beausoleil zu etwas Besonderem.
					</p>
					<div class="flex justify-center md:justify-start gap-4">
						<UButton to="/about" size="xl" color="neutral" variant="outline" class="rounded-full px-8">
							Mehr erfahren
						</UButton>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<img
						src="/giens/giensgarten.webp"
						alt="Gartenansicht"
						width="400"
						height="400"
						loading="lazy"
						class="rounded-3xl shadow-lg rotate-2 md:rotate-3 hover:rotate-0 transition-transform duration-500 aspect-square object-cover" />
					<img
						src="/giens/giensschaukeln.webp"
						alt="Schaukeln"
						width="400"
						height="400"
						loading="lazy"
						class="rounded-3xl shadow-lg -rotate-2 md:rotate-3 hover:rotate-0 transition-transform duration-500 aspect-square object-cover mt-4 md:mt-8" />
				</div>
			</div>
		</section>

		<section class="space-y-8 md:space-y-12">
			<div class="max-w-screen-xl mx-auto px-4">
				<UiTitle subtitle="Impressionen" title="Die Schönheit von Giens" />
			</div>
			<UiSlides class="mb-8" />
		</section>

		<section id="news" class="max-w-screen-xl mx-auto px-4 w-full">
			<div class="flex items-end justify-between mb-8 md:mb-12">
				<UiTitle subtitle="Was gerade läuft" title="Aktuelles" class="mb-0!" />
				<UButton to="/news" variant="link" color="neutral" icon="i-lucide-arrow-right" trailing>Alle News</UButton>
			</div>
			<ClientOnly>
				<div class="grid gap-8">
					<template v-if="status === 'pending'">
						<UiSummarySkeleton v-for="i in 3" :key="`skeleton-${i}`" :index="i" />
					</template>
					<template v-else>
						<UiSummary
							v-for="(article, index) of news"
							:key="article.id"
							:link="`/article/${article.id}`"
							:id="article.id"
							:title="article.title"
							:subtitle="article.intro"
							:image-url="article.image"
							:labels="article.tags"
							:author="article.author"
							:author-uid="article.authorUid"
							:index="index"
							:date="new Date(article.published).toLocaleDateString('de-CH')" />
					</template>
				</div>
				<template #fallback>
					<div class="grid gap-8">
						<UiSummarySkeleton v-for="i in 3" :key="`fallback-skeleton-${i}`" :index="i" />
					</div>
				</template>
			</ClientOnly>
		</section>
	</div>
</template>

<script lang="ts" setup>
const nuxtApp = useNuxtApp();
const token = computed(() => process.client ? (nuxtApp as any).$token?.value : null);

const { data: news, status } = await useLazyFetch<any[]>("/api/news", {
	key: "news-home",
	method: "post",
	body: { quantity: 3 },
	getCachedData(key) {
		if (import.meta.test) return;
		const cached = (nuxtApp.payload as any).data[key] || (nuxtApp.static.data as any)[key];
		if (!cached) return;

		const fetchedAt = (nuxtApp.payload as any)._fetchedAt?.[key] || 0;
		if (Date.now() - fetchedAt > 1000 * 60 * 5) return;

		return cached;
	},
	onResponse({ response }) {
		if (response._data) {
			(nuxtApp.payload as any)._fetchedAt = (nuxtApp.payload as any)._fetchedAt || {};
(nuxtApp.payload as any)._fetchedAt["news-home"] = Date.now();
		}
		},
});

useHead({
	link: [
		{
			rel: "preload",
			as: "image",
			href: "/giens/hauseingang_cropped-1920w.webp",
			fetchpriority: "high"
		}
	]
});
</script>
