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
				<div class="p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-home" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Wohnkomfort</h3>
					<p class="text-stone-500 text-sm leading-relaxed">
						Jedes Haus verfügt über eine gedeckte Terrasse (Patio) und einen privaten Parkplatz direkt vor der Tür.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-bike" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Gemeinschaftsgut</h3>
					<p class="text-stone-500 text-sm leading-relaxed">
						Fahrräder, Spielzeug und eine Bibliothek (DE/FR) stehen allen Bewohnern zur freien Nutzung zur Verfügung.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-washing-machine" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Praktisch</h3>
					<p class="text-stone-500 text-sm leading-relaxed">
						Zentrale Waschmaschinen und ein grosszügiger Bereich zum Wäschetrocknen im grünen Garten.
					</p>
				</div>
				<div class="p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-green-600 dark:text-green-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-leaf" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Natur pur</h3>
					<p class="text-stone-500 text-sm leading-relaxed">
						Die Siedlung ist reich bepflanzt und bietet schattige Plätze sowie eine ruhige, entspannte Atmosphäre.
					</p>
				</div>
			</div>
		</section>

		<section class="bg-stone-50 dark:bg-stone-900/50 py-12 md:py-24 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 overflow-hidden relative shadow-sm">
			<div class="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
				<div class="space-y-6 md:space-y-8 text-center md:text-left">
					<h2 class="text-3xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">Miteinander Gestalten</h2>
					<p class="text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed">
						Im Zentrum unserer Gemeinschaft aus 20 Miteigentümern stehen Zusammenhalt, gegenseitiger Respekt und das gemeinsame Engagement. Im Frühling und Herbst arbeiten wir gemeinsam an der Pflege und Verschönerung der Siedlung.
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

		<!-- Statistics Banner -->
		<div class="max-w-screen-xl mx-auto px-4 mt-12 mb-8">
			<div class="flex items-center justify-center gap-4 md:gap-8 text-center py-8">
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">20</span>
					<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Häuser</span>
				</div>
				<div class="w-8 md:w-12 h-px bg-gray-200 dark:bg-stone-800"></div>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">40+</span>
					<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Jahre</span>
				</div>
				<div class="w-8 md:w-12 h-px bg-gray-200 dark:bg-stone-800"></div>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">1</span>
					<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Spirit</span>
				</div>
			</div>
		</div>

		<!-- Timeline Section -->
		<section class="bg-stone-50 dark:bg-stone-900/50 py-16 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm">
			<div class="max-w-screen-lg mx-auto px-4">
				<div class="text-center mb-10 md:mb-16">
					<h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Unsere Geschichte</h2>
					<div class="w-16 md:w-20 h-1 bg-primary mx-auto mt-3 md:mt-4 rounded-full"></div>
				</div>
				<UTimeline :default-value="3" :items="timelineItems" class="max-w-2xl mx-auto" />
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
import type { TimelineItem } from "@nuxt/ui";

const nuxtApp = useNuxtApp();
const token = computed(() => import.meta.client ? (nuxtApp as any).$token?.value : null);

const timelineItems = ref<TimelineItem[]>([
	{
		date: "1979/1980",
		title: "Gründung der Résidence",
		description: "Die Familien Hertoux und Tellier erstellen die Résidence Beausoleil mit insgesamt 20 Häusern.",
		icon: "i-lucide-home",
	},
	{
		date: "1989",
		title: "Erste Verkäufe",
		description: "Beginn des schrittweisen Verkaufs der Häuser an private Eigentümer.",
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "2006",
		title: "Vollständig privatisiert",
		description: "Alle 20 Häuser befinden sich im Privatbesitz von Eigentümern aus Frankreich und der Schweiz.",
		icon: "i-lucide-users",
	},
	{
		date: "Heute",
		title: "Lebendige Gemeinschaft",
		description: "Die 20 Eigentümer arbeiten gemeinsam an der Pflege und Verschönerung der Siedlung.",
		icon: "i-lucide-heart-handshake",
	},
]);

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
