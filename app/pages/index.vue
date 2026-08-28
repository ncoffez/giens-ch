<script lang="ts" setup>
import type { TimelineItem } from "@nuxt/ui";
import type { FeatureCard, StatItem, TimelineItem as AppTimelineItem } from "../../types";

const { t } = useI18n();
const localePath = useLocalePath();

const defaultFeatureCards: FeatureCard[] = [
	{
		icon: "i-lucide-home",
		title: t("home.defaults.features.comfort.title"),
		description: t("home.defaults.features.comfort.description"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-sun",
		title: t("home.defaults.features.terrace.title"),
		description: t("home.defaults.features.terrace.description"),
		bgColor: "amber",
		iconColor: "amber",
	},
	{
		icon: "i-lucide-heart-handshake",
		title: t("home.defaults.features.shared.title"),
		description: t("home.defaults.features.shared.description"),
		bgColor: "rose",
		iconColor: "rose",
	},
	{
		icon: "i-lucide-trees",
		title: t("home.defaults.features.garden.title"),
		description: t("home.defaults.features.garden.description"),
		bgColor: "emerald",
		iconColor: "emerald",
	},
];

const defaultStats: StatItem[] = [
	{ value: "20", label: t("home.defaults.stats.houses") },
	{ value: "40+", label: t("home.defaults.stats.years") },
	{ value: "1", label: t("home.defaults.stats.spirit") },
];

const defaultTimeline: AppTimelineItem[] = [
	{
		date: "1979/1980",
		title: t("home.defaults.timeline.foundation.title"),
		description: t("home.defaults.timeline.foundation.description"),
		icon: "i-lucide-home",
	},
	{
		date: "1989",
		title: t("home.defaults.timeline.sales.title"),
		description: t("home.defaults.timeline.sales.description"),
		icon: "i-lucide-circle-dollar-sign",
	},
	{
		date: "2006",
		title: t("home.defaults.timeline.privateOwnership.title"),
		description: t("home.defaults.timeline.privateOwnership.description"),
		icon: "i-lucide-users",
	},
	{
		date: t("home.defaults.timeline.today.date"),
		title: t("home.defaults.timeline.today.title"),
		description: t("home.defaults.timeline.today.description"),
		icon: "i-lucide-heart-handshake",
	},
];

const defaultMiteinanderContent = `<p>${t("home.defaults.miteinander")}</p>`;

const publicPageBundle = await usePublicPageBundle("home");
const featureCards = publicPageBundle.createDataSection<FeatureCard[]>("index-features", defaultFeatureCards);
const miteinanderContent = publicPageBundle.createContentSection("index-miteinander", defaultMiteinanderContent);
const stats = publicPageBundle.createDataSection<StatItem[]>("index-stats", defaultStats);
const timeline = publicPageBundle.createDataSection<AppTimelineItem[]>("index-timeline", defaultTimeline);

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
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<UiOpenSection :subtitle="t('home.features.subtitle')" :title="t('home.features.title')">
				<template #actions>
					<template v-if="featureCards.canEdit.value && !featureCards.isEditing.value">
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
					<UiFeatureCards :cards="featureCards.data.value" />
					<ClientOnly v-if="featureCards.isEditing.value">
						<div class="mt-8">
							<UiLazyFeatureCardsEditor v-model="featureCards.data.value" />
						</div>
					</ClientOnly>
				</template>
			</UiOpenSection>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<UiOpenSection :subtitle="t('home.miteinander.subtitle')" :title="t('home.miteinander.title')">
				<template #actions>
					<template v-if="miteinanderContent.canEdit.value && !miteinanderContent.isEditing.value">
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

				<div class="space-y-8">
					<div class="max-w-3xl space-y-6">
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

					<!-- Bilder nebeneinander unter dem Text: in einer schmalen Seitenspalte
					     würden zwei Querformate übereinander die Sektion ~950px hoch machen.
					     So bleiben die Gruppenaufnahmen gross genug, um Gesichter zu erkennen. -->
					<div class="grid gap-5 sm:grid-cols-2">
						<img
							src="/giens/giens-terrassenbau.webp"
							alt="Miteigentümer verlegen gemeinsam eine Holzterrasse"
							width="1000"
							height="666"
							loading="lazy"
							class="aspect-[3/2] w-full rounded-2xl object-cover" />
						<img
							src="/giens/giens-grabarbeiten.webp"
							alt="Gemeinsame Grabarbeiten in der Siedlung"
							width="1000"
							height="666"
							loading="lazy"
							class="aspect-[3/2] w-full rounded-2xl object-cover" />
					</div>
				</div>
			</UiOpenSection>
		</section>

		<section class="mx-auto w-full max-w-screen-xl px-4 md:px-6">
			<div class="grid gap-6 border-y border-[var(--app-border)] py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
				<div class="text-center md:text-left">
					<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">
						{{ t("home.stats.title") }}
					</p>
				</div>
				<div class="flex items-center justify-end gap-2">
					<template v-if="stats.canEdit.value && !stats.isEditing.value">
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
					<template v-if="timeline.canEdit.value && !timeline.isEditing.value">
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
				<template v-else-if="timeline.status.value !== 'pending'">
					<UTimeline
						:default-value="3"
						:items="timelineItems"
						class="max-w-3xl" />
					<ClientOnly v-if="timeline.isEditing.value">
						<div class="mt-8">
							<UiLazyTimelineEditor v-model="timeline.data.value" />
						</div>
					</ClientOnly>
				</template>
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
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-accent)]">{{ t("home.discover.kicker") }}</p>
							<h3 class="display-copy text-3xl tracking-[-0.03em] text-[var(--app-text)]">{{ t("nav.entdecken") }}</h3>
							<p class="max-w-md text-sm leading-relaxed text-[var(--app-muted)]">{{ t("home.discover.subtitle") }}</p>
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
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">{{ t("home.organisatorisches.kicker") }}</p>
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
