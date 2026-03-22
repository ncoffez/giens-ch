<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";
import type { StatItem, TimelineItem as AppTimelineItem } from "../../types";

const defaultIntro = `<p>Im Zentrum unserer Gemeinschaft aus 20 Miteigentümern stehen Zusammenhalt, gegenseitiger Respekt und das gemeinsame Engagement für eine gepflegte und nachhaltige Siedlung. Jede und jeder bringt sich im Rahmen seiner Möglichkeiten ein und trägt so zum Wohl unserer Siedlung bei.</p>`;

const defaultCommunity = `<p>Neben der jährlichen Eigentümerversammlung finden im Frühling und Herbst Arbeitswochen statt. Während dieser gemeinsamen Einsätze werden anfallende Arbeiten erledigt und Projekte zur kontinuierlichen Verschönerung der Siedlung umgesetzt.</p><p>Gleichzeitig bieten sie die Gelegenheit, den persönlichen Austausch zu fördern und den Zusammenhalt innerhalb der Gemeinschaft zu stärken. Es steht selbstverständlich jedem Eigentümer frei, zu entscheiden, ob er sein Haus vermieten möchte oder nicht.</p><p>In unserem gemeinschaftlichen Depot finden sich Fahrräder, Strandspielzeug und Kinderwagen, die von allen genutzt werden können. Für gemütliche Stunden steht eine umfangreiche Bibliothek mit Büchern auf Deutsch und Französisch bereit.</p>`;

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

const introContent = await usePageContent("about-intro");
const timeline = await usePageData<AppTimelineItem[]>("about-timeline", defaultTimeline);
const communityContent = await usePageContent("about-community");
const stats = await usePageData<StatItem[]>("about-stats", defaultStats);

const timelineItems = computed<TimelineItem[]>(() =>
	timeline.data.value.map((item) => ({
		date: item.date,
		title: item.title,
		description: item.description,
		icon: item.icon,
	})),
);
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
			
			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="introContent.isAdmin.value && !introContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="introContent.startEditing()"
					>
						Bearbeiten
					</UButton>
				</template>
				<template v-else-if="introContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="introContent.cancelEditing()"
						:disabled="introContent.isSaving.value"
					>
						Abbrechen
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="introContent.isSaving.value"
						@click="introContent.save()"
					>
						Speichern
					</UButton>
				</template>
			</div>

			<div v-if="introContent.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<TiptapEditor v-if="introContent.isEditing.value" v-model="introContent.content.value" />
				<div
					v-else
					class="text-lg md:text-xl text-stone-600 dark:text-stone-400 mt-6 md:mt-8 leading-relaxed prose dark:prose-invert max-w-none"
					v-html="introContent.content.value || defaultIntro"
				/>
			</ClientOnly>
		</section>

		<!-- Timeline -->
		<section
			class="max-w-screen-lg mx-auto px-4 py-12 md:py-16 bg-stone-50 dark:bg-stone-900/50 rounded-[2rem] md:rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm">
			<div class="text-center mb-10 md:mb-16">
				<h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Unsere Geschichte</h2>
				<div class="w-16 md:w-20 h-1 bg-primary mx-auto mt-3 md:mt-4 rounded-full"></div>
			</div>

			<div class="flex items-center justify-end mb-4 px-4 gap-2">
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
				<UiTimelineEditor v-if="timeline.isEditing.value" v-model="timeline.data.value" class="max-w-2xl mx-auto" />
				<UTimeline v-else :default-value="5" :items="timelineItems" class="max-w-2xl mx-auto" />
			</ClientOnly>
		</section>

		<!-- Community Life -->
		<section class="max-w-screen-xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
			<div
				class="order-2 md:order-1 rounded-3xl overflow-clip shadow-2xl rotate-1 md:rotate-2 hover:rotate-0 transition-transform duration-500 aspect-video md:aspect-square">
				<img src="/giens/giensschaukeln.webp" alt="Schaukeln im Lotissement" class="w-full h-full object-cover" />
			</div>
			<div class="order-1 md:order-2 space-y-4 md:space-y-6">
				<UiTitle subtitle="Gemeinschaft" title="Das Leben im Lotissement" />

				<div class="flex items-center justify-end gap-2">
					<template v-if="communityContent.isAdmin.value && !communityContent.isEditing.value">
						<UButton
							color="neutral"
							variant="outline"
							icon="i-lucide-edit"
							size="sm"
							@click="communityContent.startEditing()"
						>
							Bearbeiten
						</UButton>
					</template>
					<template v-else-if="communityContent.isEditing.value">
						<UButton
							color="neutral"
							variant="ghost"
							size="sm"
							@click="communityContent.cancelEditing()"
							:disabled="communityContent.isSaving.value"
						>
							Abbrechen
						</UButton>
						<UButton
							color="primary"
							icon="i-lucide-save"
							size="sm"
							:loading="communityContent.isSaving.value"
							@click="communityContent.save()"
						>
							Speichern
						</UButton>
					</template>
				</div>

				<div v-if="communityContent.status.value === 'pending'" class="flex justify-center py-8">
					<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<ClientOnly v-else>
					<TiptapEditor v-if="communityContent.isEditing.value" v-model="communityContent.content.value" />
					<div
						v-else
						class="prose dark:prose-invert max-w-none text-base md:text-lg"
						v-html="communityContent.content.value || defaultCommunity"
					/>
				</ClientOnly>

				<div class="flex items-center justify-end gap-2 mt-4">
					<template v-if="stats.isAdmin.value && !stats.isEditing.value">
						<UButton
							color="neutral"
							variant="outline"
							icon="i-lucide-edit"
							size="sm"
							@click="stats.startEditing()"
						>
							Statistiken bearbeiten
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

				<div v-if="stats.status.value === 'pending'" class="flex justify-center py-4">
					<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<ClientOnly v-else>
					<UiStatsEditor v-if="stats.isEditing.value" v-model="stats.data.value" />
					<div v-else class="flex gap-6 md:gap-8 pt-4 md:pt-6 justify-center md:justify-start">
						<template v-for="(stat, index) in stats.data.value" :key="index">
							<div class="flex flex-col items-center">
								<span class="text-4xl md:text-5xl font-black text-primary tracking-tighter">{{ stat.value }}</span>
								<span class="text-[10px] md:text-xs uppercase tracking-widest font-black text-stone-600 dark:text-stone-400">{{ stat.label }}</span>
							</div>
							<div v-if="index < stats.data.value.length - 1" class="w-px h-10 md:h-12 bg-gray-200 dark:bg-stone-800"></div>
						</template>
					</div>
				</ClientOnly>
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
