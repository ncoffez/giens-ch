<script lang="ts" setup>
import type { TimelineItem } from "@nuxt/ui";
import type { FeatureCard, StatItem, TimelineItem as AppTimelineItem } from "../../types";

const defaultFeatureCards: FeatureCard[] = [
	{
		icon: "i-lucide-home",
		title: "Wohnkomfort",
		description: "40 m² Wohnfläche mit offener Küche, Wohnbereich und zwei Schlafzimmern. Galerie im Obergeschoss mit Badezimmer. Elektroheizung für kühlere Tage.",
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-sun",
		title: "Terrasse & Parkplatz",
		description: "Private Sonnenterrasse auf der Südseite – ideal für Frühstück und Sonnenuntergänge. Ein reservierter Parkplatz pro Haus.",
		bgColor: "amber",
		iconColor: "amber",
	},
	{
		icon: "i-lucide-heart-handshake",
		title: "Gemeinschaftsgut",
		description: "Fahrräder, Strandspielzeug und eine Bibliothek (DE/FR) stehen allen zur Verfügung. Zwei Grillplätze laden zum gemeinsamen Kochen ein.",
		bgColor: "rose",
		iconColor: "rose",
	},
	{
		icon: "i-lucide-trees",
		title: "Garten & Umgebung",
		description: "Reich bepflanzte Anlage mit schattigen Plätzen. Nur 1 km zum Fährhafen, wenige Minuten zu den Stränden und Wanderwegen.",
		bgColor: "emerald",
		iconColor: "emerald",
	},
];

const defaultStats: StatItem[] = [
	{ value: "20", label: "Häuser" },
	{ value: "40+", label: "Jahre" },
	{ value: "1", label: "Spirit" },
];

const defaultTimeline: AppTimelineItem[] = [
	{
		date: "1979/1980",
		title: "Gründung der Résidence",
		description: "Die Familien Hertoux und Tellier erstellen die Résidence Beausoleil mit insgesamt 20 Häusern. Die beiden Familien besitzen je die Hälfte der Liegenschaft.",
		icon: "i-lucide-home",
	},
	{
		date: "1989",
		title: "Erste Verkäufe",
		description: "Die Familie Tellier beginnt mit dem Verkauf ihrer 10 Häuser. Acht Häuser gehen an die Schweizer Ferien- und Skihausgenossenschaft der Eisenbahner (FSG), zwei in Privatbesitz. Auch die Familie Hertoux beginnt mit dem schrittweisen Verkauf.",
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "2006",
		title: "Vollständig privatisiert",
		description: "Mit dem Verkauf der verbliebenen FSG-Häuser befinden sich nun alle 20 Häuser im Privatbesitz. Die Eigentümer aus Frankreich und der Schweiz nutzen die Häuser als Zweitwohnsitze.",
		icon: "i-lucide-users",
	},
	{
		date: "Heute",
		title: "Lebendige Gemeinschaft",
		description: "Die 20 Eigentümer treffen sich jährlich zur Eigentümerversammlung und arbeiten im Frühling und Herbst gemeinsam an der Pflege und Verschönerung der Siedlung.",
		icon: "i-lucide-heart-handshake",
	},
];

const defaultMiteinanderContent = `<p>Im Zentrum unserer Gemeinschaft aus 20 Miteigentümern stehen Zusammenhalt, gegenseitiger Respekt und das gemeinsame Engagement. Im Frühling und Herbst arbeiten wir gemeinsam an der Pflege und Verschönerung der Siedlung.</p>`;

const featureCards = await usePageData<FeatureCard[]>("index-features", defaultFeatureCards);
const miteinanderContent = await usePageContent("index-miteinander");
const stats = await usePageData<StatItem[]>("index-stats", defaultStats);
const timeline = await usePageData<AppTimelineItem[]>("index-timeline", defaultTimeline);

const timelineItems = computed<TimelineItem[]>(() => 
	timeline.data.value.map((item) => ({
		date: item.date,
		title: item.title,
		description: item.description,
		icon: item.icon,
	})),
);

useHead({
	link: [
		{
			rel: "preload",
			as: "image",
			href: "/giens/giens-hauser-1920w.webp",
			fetchpriority: "high",
		},
	],
});
</script>

<template>
	<div class="gap-24 flex flex-col mb-20">
		<UiHero
			title="Willkommen im Beausoleil"
			subtitle="Ihre Oase auf der Halbinsel Giens – seit über 30 Jahren."
			src="/giens/giens-hauser.jpeg"
			alt="Giens Häuser"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<!-- Feature Cards Section -->
		<section class="max-w-screen-xl mx-auto w-full px-4">
			<UiTitle subtitle="Was uns auszeichnet" title="Wohlfühlen und Erleben" />
			
			<div class="flex items-center justify-end mb-4 gap-2">
				<template v-if="featureCards.isAdmin.value && !featureCards.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						@click="featureCards.startEditing()"
					>
						Bearbeiten
					</UButton>
				</template>
				<template v-else-if="featureCards.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						@click="featureCards.cancelEditing()"
						:disabled="featureCards.isSaving.value"
					>
						Abbrechen
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						:loading="featureCards.isSaving.value"
						@click="featureCards.save()"
					>
						Speichern
					</UButton>
				</template>
			</div>

			<div v-if="featureCards.status.value === 'pending'" class="flex justify-center py-12">
				<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<template v-else>
				<ClientOnly>
					<UiFeatureCardsEditor v-if="featureCards.isEditing.value" v-model="featureCards.data.value" />
					<UiFeatureCards v-else :cards="featureCards.data.value" />
				</ClientOnly>
			</template>
		</section>

		<!-- Miteinander Section -->
		<section
			class="bg-stone-50 dark:bg-stone-900/50 py-12 md:py-24 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 overflow-hidden relative shadow-sm">
			<div class="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
				<div class="space-y-6 md:space-y-8 text-center md:text-left">
					<h2 class="text-3xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
						Miteinander Gestalten
					</h2>
					
					<div class="flex items-center justify-end gap-2">
						<template v-if="miteinanderContent.isAdmin.value && !miteinanderContent.isEditing.value">
							<UButton
								color="neutral"
								variant="outline"
								icon="i-lucide-edit"
								size="sm"
								@click="miteinanderContent.startEditing()"
							>
								Bearbeiten
							</UButton>
						</template>
						<template v-else-if="miteinanderContent.isEditing.value">
							<UButton
								color="neutral"
								variant="ghost"
								size="sm"
								@click="miteinanderContent.cancelEditing()"
								:disabled="miteinanderContent.isSaving.value"
							>
								Abbrechen
							</UButton>
							<UButton
								color="primary"
								icon="i-lucide-save"
								size="sm"
								:loading="miteinanderContent.isSaving.value"
								@click="miteinanderContent.save()"
							>
								Speichern
							</UButton>
						</template>
					</div>

					<div v-if="miteinanderContent.status.value === 'pending'" class="flex justify-center py-6">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-else>
						<TiptapEditor v-if="miteinanderContent.isEditing.value" v-model="miteinanderContent.content.value" />
						<div
							v-else
							class="text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed prose dark:prose-invert max-w-none"
							v-html="miteinanderContent.content.value || defaultMiteinanderContent"
						/>
					</ClientOnly>

					<div class="flex justify-center md:justify-start gap-4">
						<UButton
							to="/about"
							size="xl"
							color="neutral"
							variant="outline"
							class="rounded-full px-8">
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
			<div class="flex items-center justify-end mb-4 gap-2">
				<template v-if="stats.isAdmin.value && !stats.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="stats.startEditing()"
					>
						Bearbeiten
					</UButton>
				</template>
				<template v-else-if="stats.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="stats.cancelEditing()"
						:disabled="stats.isSaving.value"
					>
						Abbrechen
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="stats.isSaving.value"
						@click="stats.save()"
					>
						Speichern
					</UButton>
				</template>
			</div>

			<div v-if="stats.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<UiStatsEditor v-if="stats.isEditing.value" v-model="stats.data.value" />
				<UiStats v-else :stats="stats.data.value" />
			</ClientOnly>
		</div>

		<!-- Timeline Section -->
		<section
			id="geschichte"
			class="bg-stone-50 dark:bg-stone-900/50 py-16 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm scroll-mt-24">
			<div class="max-w-screen-lg mx-auto px-4">
				<div class="text-center mb-10 md:mb-16">
					<h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
						Unsere Geschichte
					</h2>
					<div class="w-16 md:w-20 h-1 bg-primary mx-auto mt-3 md:mt-4 rounded-full"></div>
				</div>

				<div class="flex items-center justify-end mb-4 gap-2">
					<template v-if="timeline.isAdmin.value && !timeline.isEditing.value">
						<UButton
							color="neutral"
							variant="outline"
							icon="i-lucide-edit"
							size="sm"
							@click="timeline.startEditing()"
						>
							Bearbeiten
						</UButton>
					</template>
					<template v-else-if="timeline.isEditing.value">
						<UButton
							color="neutral"
							variant="ghost"
							size="sm"
							@click="timeline.cancelEditing()"
							:disabled="timeline.isSaving.value"
						>
							Abbrechen
						</UButton>
						<UButton
							color="primary"
							icon="i-lucide-save"
							size="sm"
							:loading="timeline.isSaving.value"
							@click="timeline.save()"
						>
							Speichern
						</UButton>
					</template>
				</div>

				<div v-if="timeline.status.value === 'pending'" class="flex justify-center py-12">
					<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<ClientOnly v-else>
					<UiTimelineEditor v-if="timeline.isEditing.value" v-model="timeline.data.value" />
					<UTimeline v-else :default-value="3" :items="timelineItems" class="max-w-2xl mx-auto" />
				</ClientOnly>
			</div>
		</section>

		<section class="space-y-8 md:space-y-12">
			<div class="max-w-screen-xl mx-auto px-4">
				<UiTitle subtitle="Impressionen" title="Die Schönheit von Giens" />
			</div>
			<UiSlides class="mb-8" />
		</section>

		<!-- Organisatorisches Link Section -->
		<section class="max-w-screen-xl mx-auto px-4 w-full">
			<NuxtLink
				to="/organisatorisches"
				class="block p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 hover:border-primary/40 transition-all group"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl">
							<UIcon name="i-lucide-clipboard-list" class="w-6 h-6 text-primary" />
						</div>
						<div>
							<h3 class="font-bold text-lg">Organisatorisches</h3>
							<p class="text-stone-500 text-sm">Wichtige Informationen zur Résidence</p>
						</div>
					</div>
					<UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
				</div>
			</NuxtLink>
		</section>
	</div>
</template>
