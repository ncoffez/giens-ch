<template>
	<div class="gap-24 flex flex-col mb-20">
		<section class="relative">
			<div class="rounded-[2.5rem] w-full mx-auto overflow-clip shadow-2xl h-[60vh]">
				<img
					class="object-cover h-full w-full brightness-110 contrast-[90%] scale-105"
					src="/giens/hauseingang_cropped.jpg"
					alt="Einfahrt" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-12">
					<div class="text-white">
						<h1 class="text-5xl md:text-7xl font-black mb-4 tracking-tighter">Willkommen im Beausoleil</h1>
						<p class="text-xl md:text-2xl font-medium text-white/90">
							Ihre Oase auf der Halbinsel Giens – seit über 30 Jahren.
						</p>
					</div>
				</div>
			</div>
		</section>

		<section class="max-w-screen-xl mx-auto w-full px-4">
			<UiTitle subtitle="Was uns auszeichnet" title="Wohlfühlen und Erleben" />
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
				<div class="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-home" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Wohnkomfort</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Jedes Haus verfügt über eine gedeckte Terrasse (Patio) und einen privaten Parkplatz direkt vor der Tür.
					</p>
				</div>
				<div class="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-bike" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Gemeinschaftsgut</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Fahrräder, Spielzeug und eine Bibliothek (DE/FR) stehen allen Bewohnern zur freien Nutzung zur Verfügung.
					</p>
				</div>
				<div class="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
					<div class="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 w-fit rounded-2xl">
						<UIcon name="i-lucide-washing-machine" class="w-8 h-8" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Praktisch</h3>
					<p class="text-gray-500 text-sm leading-relaxed">
						Zentrale Waschmaschinen und ein grosszügiger Bereich zum Wäschetrocknen im grünen Garten.
					</p>
				</div>
				<div class="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
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

		<section class="bg-gray-50 dark:bg-gray-900/50 py-24 rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden relative shadow-sm">
			<div class="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
				<div class="space-y-8">
					<h2 class="text-4xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">Miteinander Gestalten</h2>
					<p class="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
						Zweimal im Jahr treffen wir uns als Gemeinschaft, um die Siedlung zu pflegen und neue Projekte umzusetzen. Dieser Hands-on-Spirit macht das Beausoleil zu etwas Besonderem.
					</p>
					<div class="flex gap-4">
						<UButton to="/about" size="xl" color="neutral" variant="outline" class="rounded-full px-8">
							Mehr erfahren
						</UButton>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<img src="/giens/garten.jpeg" class="rounded-3xl shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500 aspect-square object-cover" alt="Gartenansicht" />
					<img src="/giens/schaukeln.jpeg" class="rounded-3xl shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-500 aspect-square object-cover mt-8" alt="Schaukeln" />
				</div>
			</div>
		</section>

		<section class="space-y-12">
			<div class="max-w-screen-xl mx-auto px-4">
				<UiTitle subtitle="Impressionen" title="Die Schönheit von Giens" />
			</div>
			<UiSlides class="mb-8" />
		</section>

		<section id="news" class="max-w-screen-xl mx-auto px-4 w-full">
			<div class="flex items-end justify-between mb-12">
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
const { $token } = useNuxtApp();

const { data: news, status } = await useLazyFetch<any[]>("/api/news", {
	method: "post",
	body: { quantity: 3 },
	headers: computed(() => {
		return $token.value ? { Authorization: `Bearer ${$token.value}` } : {};
	}),
});
</script>
