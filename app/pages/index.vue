<script lang="ts" setup>
import type { TimelineItem } from "@nuxt/ui";
import type { FeatureCard, StatItem, TimelineItem as AppTimelineItem } from "../../types";

const { t } = useI18n();
const localePath = useLocalePath();

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

const heroLeads = computed(() => [
	t("home.hero.lead"),
	t("home.hero.leads.1"),
	t("home.hero.leads.2"),
]);

const activeHeroLeadIndex = ref(0);

const activeHeroLead = computed(() => heroLeads.value[activeHeroLeadIndex.value] || heroLeads.value[0]);

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

onMounted(() => {
	if (heroLeads.value.length < 2) return;

	activeHeroLeadIndex.value = Math.floor(Math.random() * heroLeads.value.length);
});
</script>

<template>
	<div class="flex flex-col gap-20 pb-20 md:gap-24">
		<UiHero
			:title="t('hero.welcome.title')"
			:subtitle="t('hero.welcome.subtitle')"
			src="/giens/giens-hauser.jpeg"
			alt="Giens Häuser"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]"
		/>

		<section class="mx-auto -mt-24 grid w-full max-w-screen-xl gap-8 px-4 md:-mt-28 md:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.75fr)] lg:items-end">
			<div class="app-surface rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
				<div class="space-y-4">
					<p class="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-primary)]/90">
						{{ t("home.hero.kicker") }}
					</p>
					<Transition name="page" mode="out-in">
						<p
							:key="activeHeroLead"
							class="max-w-3xl text-lg md:text-[1.75rem] leading-tight text-[var(--app-text)] text-balance"
						>
							{{ activeHeroLead }}
						</p>
					</Transition>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3 border-t border-[var(--app-border)] bg-transparent pt-5 md:gap-4 lg:border-t-0 lg:bg-transparent lg:pt-0">
				<div class="px-2 py-3 text-center md:px-3">
					<div class="display-copy text-2xl md:text-3xl font-bold text-[var(--app-text)]">20</div>
					<div class="mt-1 text-xs md:text-sm uppercase tracking-[0.18em] text-[var(--app-muted)]">
						{{ t("home.hero.stats.houses") }}
					</div>
				</div>
				<div class="border-x border-[var(--app-border)] px-2 py-3 text-center md:px-3">
					<div class="display-copy text-2xl md:text-3xl font-bold text-[var(--app-text)]">15</div>
					<div class="mt-1 text-xs md:text-sm uppercase tracking-[0.18em] text-[var(--app-muted)]">
						{{ t("home.hero.stats.minutes") }}
					</div>
				</div>
				<div class="px-2 py-3 text-center md:px-3">
					<div class="display-copy text-2xl md:text-3xl font-bold text-[var(--app-text)]">Var</div>
					<div class="mt-1 text-xs md:text-sm uppercase tracking-[0.18em] text-[var(--app-muted)]">
						{{ t("home.hero.stats.region") }}
					</div>
				</div>
			</div>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<UiOpenSection :subtitle="t('home.features.subtitle')" :title="t('home.features.title')">
				<template #actions>
					<template v-if="featureCards.isAdmin.value && !featureCards.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" @click="featureCards.startEditing()">
							{{ t("editor.edit") }}
						</UButton>
					</template>
					<template v-else-if="featureCards.isEditing.value">
						<UButton color="neutral" variant="ghost" :disabled="featureCards.isSaving.value" @click="featureCards.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" :loading="featureCards.isSaving.value" @click="featureCards.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</template>

				<div v-if="featureCards.status.value === 'pending'" class="flex justify-center py-12">
					<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<template v-else>
					<ClientOnly v-if="featureCards.isEditing.value">
						<UiLazyFeatureCardsEditor v-model="featureCards.data.value" />
					</ClientOnly>
					<UiFeatureCards v-else :cards="featureCards.data.value" />
				</template>
			</UiOpenSection>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<UiOpenSection :subtitle="t('home.miteinander.subtitle')" :title="t('home.miteinander.title')">
				<template #actions>
					<template v-if="miteinanderContent.isAdmin.value && !miteinanderContent.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="miteinanderContent.startEditing()">
							{{ t("editor.edit") }}
						</UButton>
					</template>
					<template v-else-if="miteinanderContent.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="miteinanderContent.isSaving.value" @click="miteinanderContent.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="miteinanderContent.isSaving.value" @click="miteinanderContent.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</template>

				<div class="grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
					<div class="space-y-6">
						<div v-if="miteinanderContent.status.value === 'pending'" class="flex justify-center py-6">
							<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
						</div>
						<ClientOnly v-if="miteinanderContent.isEditing.value && miteinanderContent.status.value !== 'pending'">
							<TiptapLazyEditor v-model="miteinanderContent.content.value" />
						</ClientOnly>
						<div
							v-else-if="miteinanderContent.status.value !== 'pending'"
							class="prose max-w-none text-lg leading-relaxed text-[var(--app-muted)] dark:prose-invert"
							v-html="miteinanderContent.content.value || defaultMiteinanderContent"
						/>
					</div>

					<div class="grid gap-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
						<img
							src="/giens/giensgarten.webp"
							alt="Gartenansicht"
							width="700"
							height="900"
							loading="lazy"
							class="aspect-[4/5] w-full object-cover" />
						<img
							src="/giens/giensschaukeln.webp"
							alt="Schaukeln"
							width="600"
							height="700"
							loading="lazy"
							class="mt-0 aspect-[4/5] w-full object-cover sm:mt-12" />
					</div>
				</div>
			</UiOpenSection>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<div class="grid gap-6 border-y border-[var(--app-border)] py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
				<div>
					<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">Beausoleil in Zahlen</p>
				</div>
				<div class="flex items-center justify-end gap-2">
					<template v-if="stats.isAdmin.value && !stats.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="stats.startEditing()">
							{{ t("editor.edit") }}
						</UButton>
					</template>
					<template v-else-if="stats.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="stats.isSaving.value" @click="stats.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="stats.isSaving.value" @click="stats.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</div>
			</div>

			<div v-if="stats.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-if="stats.isEditing.value && stats.status.value !== 'pending'">
				<UiLazyStatsEditor v-model="stats.data.value" />
			</ClientOnly>
			<UiStats v-else-if="stats.status.value !== 'pending'" :stats="stats.data.value" />
		</section>

		<section id="geschichte" class="mx-auto w-full max-w-screen-xl scroll-mt-24 px-4 md:px-6">
			<UiOpenSection :subtitle="t('home.timeline.subtitle')" :title="t('home.timeline.title')">
				<template #actions>
					<template v-if="timeline.isAdmin.value && !timeline.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="timeline.startEditing()">
							{{ t("editor.edit") }}
						</UButton>
					</template>
					<template v-else-if="timeline.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="timeline.isSaving.value" @click="timeline.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="timeline.isSaving.value" @click="timeline.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</template>

				<div v-if="timeline.status.value === 'pending'" class="flex justify-center py-12">
					<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<ClientOnly v-if="timeline.isEditing.value && timeline.status.value !== 'pending'">
					<UiLazyTimelineEditor v-model="timeline.data.value" />
				</ClientOnly>
				<UTimeline
					v-else-if="timeline.status.value !== 'pending'"
					:default-value="3"
					:items="timelineItems"
					class="max-w-3xl" />
			</UiOpenSection>
		</section>

		<section class="space-y-8 md:space-y-12">
			<div class="mx-auto max-w-screen-xl px-4 md:px-6">
				<UiOpenSection :subtitle="t('home.impressions.subtitle')" :title="t('home.impressions.title')">
					<UiSlides class="mb-2" />
				</UiOpenSection>
			</div>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<div class="grid gap-10 border-t border-[var(--app-border)] pt-12 lg:grid-cols-2">
				<NuxtLink
					:to="localePath('/entdecken')"
					class="group block border-b border-[var(--app-border)] pb-6 transition-colors hover:text-[var(--app-accent)] lg:pb-8"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="space-y-3">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-accent)]">Rund um Giens</p>
							<h3 class="display-copy text-3xl tracking-[-0.03em] text-[var(--app-text)]">{{ t("nav.entdecken") }}</h3>
							<p class="max-w-md text-sm leading-relaxed text-[var(--app-muted)]">Märkte, Ausflüge und praktische Tipps rund um Giens.</p>
						</div>
						<UIcon name="i-lucide-arrow-right" class="mt-2 h-5 w-5 shrink-0 text-[var(--app-accent)] transition-transform group-hover:translate-x-1" />
					</div>
				</NuxtLink>

				<NuxtLink
					:to="localePath('/organisatorisches')"
					class="group block border-b border-[var(--app-border)] pb-6 transition-colors hover:text-[var(--app-primary)] lg:pb-8"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="space-y-3">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">Gut vorbereitet</p>
							<h3 class="display-copy text-3xl tracking-[-0.03em] text-[var(--app-text)]">{{ t("home.organisatorisches.title") }}</h3>
							<p class="max-w-md text-sm leading-relaxed text-[var(--app-muted)]">{{ t("home.organisatorisches.subtitle") }}</p>
						</div>
						<UIcon name="i-lucide-arrow-right" class="mt-2 h-5 w-5 shrink-0 text-[var(--app-primary)] transition-transform group-hover:translate-x-1" />
					</div>
				</NuxtLink>
			</div>
		</section>
	</div>
</template>
