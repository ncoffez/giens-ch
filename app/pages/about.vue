<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

const items = ref<TimelineItem[]>([
	{
		date: "März 1992",
		title: "Kauf des Grundstücks in Giens",
		description:
			"Die SBB Pensionskasse beschliesst den Kauf des Lotissement Beausoleil und bietet ihren Mitarbeitenden vergünstigte Konditionen zum Kauf eines Ferienhauses.",
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "April 1993",
		title: "Spatenstich",
		description: "Die Bauarbeiten beginnen unter Aufsicht des lokalen Bauunternehmens Implenia France.",
		icon: "i-lucide-pickaxe",
	},
	{
		date: "Januar 1995",
		title: "Kauf der ersten Wohnung",
		description: "Die Familie Zgraggen schliesst den Kauf des Hauses Nr. 11 ab und zieht ein.",
		icon: "i-lucide-house",
	},
	{
		date: "September 1997",
		title: "Vollständige Belegung",
		description:
			"Das letzte Haus wird verkauft. Die Siedlung wimmelt von jungen Familien und Giens wird zur beliebtesten Feriendestination Südfrankreichs.",
		icon: "i-lucide-party-popper",
	},
	{
		date: "Oktober 2009",
		title: "Modernisierung & Spielplatz",
		description:
			"Nach über 15 Jahren wird das Lotissement grundsaniert. Die Gemeinschaftsbereiche werden aufgewertet und die markanten Schaukeln sowie der Spielplatz werden installiert.",
		icon: "i-lucide-toy-brick",
	},
	{
		date: "Oktober 2019",
		title: "Eigenverwaltung & Engagement",
		description:
			"Die Pensionskasse SBB zieht sich zurück. Das Lotissement wird nun vollständig durch die Bewohner verwaltet. Zweimal jährlich treffen wir uns, um die Anlage gemeinsam weiterzuentwickeln.",
		icon: "i-lucide-hammer",
	},
]);
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			title="Über uns"
			subtitle="Eine lebendige Gemeinschaft im Herzen der Halbinsel Giens."
			src="/giens/giens-aerial.webp"
			alt="Luftaufnahme von Giens"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<!-- Introduction -->
		<section class="max-w-screen-md mx-auto px-4 text-center">
			<UiTitle subtitle="Unsere Philosophie" title="Miteinander Gestalten" />
			<p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 mt-6 md:mt-8 leading-relaxed">
				Das Lotissement Beausoleil ist ein Ort der Begegnung. Seit über 30 Jahren kommen Familien hierher, um die Sonne,
				das Meer und die Gemeinschaft zu geniessen. Zweimal im Jahr treffen sich die Eigentümer, um gemeinsam Hand anzulegen und die Siedlung stetig zu verschönern.
			</p>
		</section>

		<!-- Timeline -->
		<section
			class="max-w-screen-lg mx-auto px-4 py-12 md:py-16 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
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
				<img src="/giens/schaukeln.jpeg" alt="Schaukeln im Lotissement" class="w-full h-full object-cover" />
			</div>
			<div class="order-1 md:order-2 space-y-4 md:space-y-6">
				<UiTitle subtitle="Gemeinschaft" title="Das Leben im Lotissement" />
				<div class="prose dark:prose-invert max-w-none text-base md:text-lg">
					<p>
						Das Beausoleil lebt von seinen Bewohnern. In unserem gemeinschaftlichen Depot finden sich **Fahrräder, Strandspielzeug und Kinderwagen**, die von allen genutzt werden können.
					</p>
					<p>
						Für gemütliche Stunden steht eine umfangreiche **Bibliothek mit Büchern auf Deutsch und Französisch** bereit. In der üppig bepflanzten Gartenanlage finden sich zudem Waschmaschinen und grosszügige Plätze zum Trocknen der Wäsche unter freiem Himmel.
					</p>
					<p>
						Die Siedlung wird durch einen ehrenamtlichen Verwaltungsrat geführt. Gemeinsam sorgen wir dafür, dass die Infrastruktur gepflegt bleibt und der familiäre Charme erhalten wird.
					</p>
				</div>
				<div class="flex gap-6 md:gap-8 pt-4 md:pt-6 justify-center md:justify-start">
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">22</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-gray-600 dark:text-gray-400">Häuser</span>
					</div>
					<div class="w-px h-10 md:h-12 bg-gray-200 dark:bg-gray-800"></div>
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">30+</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-gray-600 dark:text-gray-400">Jahre</span>
					</div>
					<div class="w-px h-10 md:h-12 bg-gray-200 dark:bg-gray-800"></div>
					<div class="flex flex-col items-center">
						<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">1</span>
						<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-gray-600 dark:text-gray-400">Spirit</span>
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

