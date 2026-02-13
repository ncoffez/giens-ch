<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

const items = ref<TimelineItem[]>([
	{
		date: "1979/1980",
		title: "Gründung der Résidence",
		description:
			"Die Familien Hertoux und Tellier erstellen die Résidence Beausoleil mit insgesamt 20 Häusern. Die beiden Familien besitzen je die Hälfte der Liegenschaft.",
		icon: "i-lucide-home",
	},
	{
		date: "1989",
		title: "Erste Verkäufe",
		description:
			"Die Familie Tellier beginnt mit dem Verkauf ihrer 10 Häuser. Acht Häuser gehen an die Schweizer Ferien- und Skihausgenossenschaft der Eisenbahner (FSG), zwei in Privatbesitz. Auch die Familie Hertoux beginnt mit dem schrittweisen Verkauf.",
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "2006",
		title: "Vollständig privatisiert",
		description:
			"Mit dem Verkauf der verbliebenen FSG-Häuser befinden sich nun alle 20 Häuser im Privatbesitz. Die Eigentümer aus Frankreich und der Schweiz nutzen die Häuser als Zweitwohnsitze.",
		icon: "i-lucide-users",
	},
	{
		date: "Heute",
		title: "Lebendige Gemeinschaft",
		description:
			"Die 20 Eigentümer treffen sich jährlich zur Eigentümerversammlung und arbeiten im Frühling und Herbst gemeinsam an der Pflege und Verschönerung der Siedlung.",
		icon: "i-lucide-heart-handshake",
	},
]);
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			title="Über uns"
			subtitle="Eine Gemeinschaft von 20 Eigentümern auf der Halbinsel Giens."
			src="/giens/giens-aerial.webp"
			alt="Luftaufnahme von Giens"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<!-- Introduction -->
		<section class="max-w-screen-md mx-auto px-4 text-center">
			<UiTitle subtitle="Unsere Philosophie" title="Miteinander Gestalten" />
			<p class="text-lg md:text-xl text-stone-600 dark:text-stone-400 mt-6 md:mt-8 leading-relaxed">
				Im Zentrum unserer Gemeinschaft aus 20 Miteigentümern stehen Zusammenhalt, gegenseitiger Respekt und das gemeinsame Engagement für eine gepflegte und nachhaltige Siedlung. Jede und jeder bringt sich im Rahmen seiner Möglichkeiten ein und trägt so zum Wohl unserer Siedlung bei.
			</p>
		</section>

		<!-- Timeline -->
		<section
			class="max-w-screen-lg mx-auto px-4 py-12 md:py-16 bg-stone-50 dark:bg-stone-900/50 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm">
			<div class="text-center mb-10 md:mb-16">
				<h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Unsere Geschichte</h2>
				<div class="w-16 md:w-20 h-1 bg-primary mx-auto mt-3 md:mt-4 rounded-full"></div>
			</div>
			<UTimeline :default-value="5" :items="items" class="max-w-2xl mx-auto" />
		</section>

		<!-- Community Life -->
		<section class="max-w-screen-xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
			<div
				class="order-2 md:order-1 rounded-3xl overflow-clip shadow-2xl rotate-1 md:rotate-2 hover:rotate-0 transition-transform duration-500 aspect-video md:aspect-square">
				<img src="/giens/giensschaukeln.webp" alt="Schaukeln im Lotissement" class="w-full h-full object-cover" />
			</div>
			<div class="order-1 md:order-2 space-y-4 md:space-y-6">
				<UiTitle subtitle="Gemeinschaft" title="Das Leben im Lotissement" />
				<div class="prose dark:prose-invert max-w-none text-base md:text-lg">
					<p>
						Neben der jährlichen Eigentümerversammlung finden im Frühling und Herbst Arbeitswochen statt. Während dieser gemeinsamen Einsätze werden anfallende Arbeiten erledigt und Projekte zur kontinuierlichen Verschönerung der Siedlung umgesetzt.
					</p>
					<p>
						Gleichzeitig bieten sie die Gelegenheit, den persönlichen Austausch zu fördern und den Zusammenhalt innerhalb der Gemeinschaft zu stärken. Es steht selbstverständlich jedem Eigentümer frei, zu entscheiden, ob er sein Haus vermieten möchte oder nicht.
					</p>
					<p>
						In unserem gemeinschaftlichen Depot finden sich Fahrräder, Strandspielzeug und Kinderwagen, die von allen genutzt werden können. Für gemütliche Stunden steht eine umfangreiche Bibliothek mit Büchern auf Deutsch und Französisch bereit.
					</p>
				</div>
				<div class="flex gap-6 md:gap-8 pt-4 md:pt-6 justify-center md:justify-start">
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">20</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Häuser</span>
					</div>
					<div class="w-px h-10 md:h-12 bg-gray-200 dark:bg-stone-800"></div>
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">40+</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Jahre</span>
					</div>
					<div class="w-px h-10 md:h-12 bg-gray-200 dark:bg-stone-800"></div>
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">1</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">Spirit</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Slides -->
		<section class="py-12 overflow-hidden">
			<div class="max-w-screen-xl mx-auto px-4 mb-4">
				<UiTitle subtitle="Impressionen" title="Wohlfühlmomente" />
			</div>
			<UiSlides />
		</section>
	</div>
</template>

