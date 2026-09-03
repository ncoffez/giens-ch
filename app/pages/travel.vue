<script lang="ts" setup>
import type { FeatureCard, JourneyStep, StatItem } from "../../types";

const { t } = useI18n();

const destinationAddress = "Avenue des Arbanais 313, 83400 Hyeres, France";
const destinationQuery = "Lotissement Beausoleil, Avenue des Arbanais 313, Hyeres";
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(destinationQuery)}&output=embed`;
const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;

const defaultLage = `<p>Unsere Ferienhäuser liegen idyllisch auf der Halbinsel von Giens an der Avenue des Arbanais 313, nur etwa 15 Gehminuten vom Strand und vom Dorfzentrum entfernt.</p><p>Die Halbinsel von Giens befindet sich bei etwa 43°2′ nördlicher Breite an der Côte d'Azur im Département Var und gehört zu den südlichen Regionen des französischen Festlands.</p><p>Ein großer Teil der Halbinsel ist als Naturschutzgebiet ausgewiesen und steht unter besonderem Schutz. Besonders die Salinen und Feuchtgebiete zwischen den beiden Sanddämmen (Tombolos) bilden ein wichtiges Rückzugsgebiet für Zug- und Brutvögel.</p>`;

const defaultAuto = `<p>Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und Pausen etwa 7 bis 8 Stunden.</p>`;

const defaultZug = `<p>Die Anreise mit dem Zug ist eine bequeme Alternative. SNCF bietet hervorragende Verbindungen mit dem TGV an, oft mit nur zwei Umstiegen ab der Schweiz.</p>`;

const defaultFlugzeug = `<p>Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für Kurztrips.</p><p>Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem Auto.</p>`;

const defaultRouteFacts: StatItem[] = [
	{ value: "700 km", label: t("travel.intro.facts.distance") },
	{ value: "7-8 h", label: t("travel.intro.facts.drive") },
	{ value: "15 min", label: t("travel.intro.facts.airport") },
];

const defaultPlanningPillars: FeatureCard[] = [
	{
		title: t("travel.intro.pillars.drive.title"),
		description: t("travel.intro.pillars.drive.description"),
		icon: "i-lucide-car",
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		title: t("travel.intro.pillars.train.title"),
		description: t("travel.intro.pillars.train.description"),
		icon: "i-lucide-train-front",
		bgColor: "emerald",
		iconColor: "emerald",
	},
	{
		title: t("travel.intro.pillars.flight.title"),
		description: t("travel.intro.pillars.flight.description"),
		icon: "i-lucide-plane",
		bgColor: "amber",
		iconColor: "amber",
	},
];

const defaultLocationFacts: StatItem[] = [
	{ label: t("travel.locationFacts.walk.label"), value: t("travel.locationFacts.walk.value") },
	{ label: t("travel.locationFacts.port.label"), value: t("travel.locationFacts.port.value") },
	{ label: t("travel.locationFacts.nature.label"), value: t("travel.locationFacts.nature.value") },
];

const defaultAutoSteps: JourneyStep[] = [
	{
		title: "Bern – Lausanne – Geneve",
		detail: "Grenze Bardonnex Richtung Frankreich",
	},
	{
		title: "Annecy – Chambery – Grenoble",
		detail: "A41 / A43 / A48",
	},
	{
		title: "Valence – Orange – Aix",
		detail: "A49 / A7 / A8",
	},
	{
		title: "Toulon – Hyeres – Giens",
		detail: "A52 / A50 / A570",
	},
];

const defaultTrainSteps: JourneyStep[] = [
	{ eyebrow: "Etappe 1", title: "Bern – Geneve", detail: "InterCity, ca. 1h 45min" },
	{ eyebrow: "Etappe 2", title: "Geneve – Marseille", detail: "TGV Lyria, ca. 4h 30min" },
	{ eyebrow: "Etappe 3", title: "Marseille – Hyeres", detail: "TER, ca. 1h" },
];

const defaultFlightFacts: FeatureCard[] = [
	{
		icon: "i-lucide-plane-takeoff",
		title: t("travel.flugzeug.directFlights"),
		description: t("travel.flugzeug.directFlightsText"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-car-front",
		title: t("travel.flugzeug.rentalCar"),
		description: t("travel.flugzeug.rentalCarText"),
		bgColor: "amber",
		iconColor: "amber",
	},
];

const publicPageBundle = await usePublicPageBundle("travel");
const lageContent = publicPageBundle.createContentSection("travel-lage", defaultLage);
const autoContent = publicPageBundle.createContentSection("travel-auto", defaultAuto);
const zugContent = publicPageBundle.createContentSection("travel-zug", defaultZug);
const flugzeugContent = publicPageBundle.createContentSection("travel-flugzeug", defaultFlugzeug);
const routeFacts = publicPageBundle.createDataSection<StatItem[]>("travel-intro-facts", defaultRouteFacts);
const planningPillars = publicPageBundle.createDataSection<FeatureCard[]>("travel-intro-pillars", defaultPlanningPillars);
const locationFacts = publicPageBundle.createDataSection<StatItem[]>("travel-location-facts", defaultLocationFacts);
const autoSteps = publicPageBundle.createDataSection<JourneyStep[]>("travel-auto-steps", defaultAutoSteps);
const trainSteps = publicPageBundle.createDataSection<JourneyStep[]>("travel-zug-steps", defaultTrainSteps);
const flightFacts = publicPageBundle.createDataSection<FeatureCard[]>("travel-flugzeug-facts", defaultFlightFacts);

function getColorClasses(color: string) {
	const colors: Record<string, { bg: string; text: string; border: string }> = {
		blue: {
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-600 dark:text-blue-400",
			border: "border-blue-100 dark:border-blue-900",
		},
		amber: {
			bg: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-600 dark:text-amber-400",
			border: "border-amber-100 dark:border-amber-900",
		},
		rose: {
			bg: "bg-rose-100 dark:bg-rose-900/30",
			text: "text-rose-600 dark:text-rose-400",
			border: "border-rose-100 dark:border-rose-900",
		},
		emerald: {
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			text: "text-emerald-600 dark:text-emerald-400",
			border: "border-emerald-100 dark:border-emerald-900",
		},
		purple: {
			bg: "bg-purple-100 dark:bg-purple-900/30",
			text: "text-purple-600 dark:text-purple-400",
			border: "border-purple-100 dark:border-purple-900",
		},
		cyan: {
			bg: "bg-cyan-100 dark:bg-cyan-900/30",
			text: "text-cyan-600 dark:text-cyan-400",
			border: "border-cyan-100 dark:border-cyan-900",
		},
	};

	return colors[color] || colors.blue;
}

function stripHtml(html: string) {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function excerptFromHtml(html: string, maxLength = 140) {
	const text = stripHtml(html);
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + "...";
}

const routeModeCards = computed(() => [
	{
		id: "mit-dem-auto",
		icon: "i-lucide-car",
		title: t("travel.auto.title"),
		kicker: t("travel.intro.pillars.drive.title"),
		summary: excerptFromHtml(autoContent.content.value || defaultAuto),
		meta: routeFacts.data.value[1]?.value || "7-8 h",
		ctaLabel: t("travel.auto.routeButton"),
		ctaHref: mapDirectionsUrl,
	},
	{
		id: "mit-dem-zug",
		icon: "i-lucide-train-front",
		title: t("travel.zug.title"),
		kicker: t("travel.intro.pillars.train.title"),
		summary: excerptFromHtml(zugContent.content.value || defaultZug),
		meta: trainSteps.data.value.length ? trainSteps.data.value.map(step => step.title).join(" -> ") : "Bern -> Marseille -> Hyeres",
		ctaLabel: t("travel.quickLinks.zug"),
		ctaHref: "#mit-dem-zug",
	},
	{
		id: "mit-dem-flugzeug",
		icon: "i-lucide-plane",
		title: t("travel.flugzeug.title"),
		kicker: t("travel.intro.pillars.flight.title"),
		summary: excerptFromHtml(flugzeugContent.content.value || defaultFlugzeug),
		meta: routeFacts.data.value[2]?.value || "15 min",
		ctaLabel: t("travel.quickLinks.flugzeug"),
		ctaHref: "#mit-dem-flugzeug",
	},
]);

const arrivalNotes = computed(() => [
	{
		icon: "i-lucide-map-pinned",
		title: destinationAddress,
		description: t("travel.intro.body"),
	},
	{
		icon: "i-lucide-car-taxi-front",
		title: t("travel.zug.transfer"),
		description: t("travel.zug.transferText"),
	},
	{
		icon: "i-lucide-info",
		title: t("travel.auto.tip"),
		description: t("travel.auto.tipText"),
	},
]);

useHead({
	title: t("nav.travel"),
});
</script>

<template>
	<div class="space-y-20 pb-20">
		<UiHero
			:title="t('hero.travel.title')"
			:subtitle="t('hero.travel.subtitle')"
			src="/giens/hyeres.webp"
			alt="Blick auf Hyeres und das Meer"
			height="h-[40vh] md:h-[52vh] min-h-[300px] md:min-h-[420px]"
			content-class="max-w-3xl"
		/>

		<section class="mx-auto max-w-screen-xl px-4">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
				<div class="space-y-6">
					<p class="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-primary)]/90">
						{{ t("travel.intro.kicker") }}
					</p>
					<h2 class="display-copy max-w-4xl text-3xl md:text-5xl leading-[1.04] tracking-[-0.05em] text-[var(--app-text)]">
						{{ t("travel.intro.lead") }}
					</h2>
					<p class="max-w-3xl text-base md:text-lg leading-relaxed text-[var(--app-muted)]">
						{{ t("travel.intro.body") }}
					</p>

					<div class="flex items-center justify-end gap-2">
						<template v-if="planningPillars.canEdit.value && !planningPillars.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="planningPillars.startEditing()">
								Elemente bearbeiten
							</UButton>
						</template>
						<template v-else-if="planningPillars.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="planningPillars.isSaving.value" @click="planningPillars.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="planningPillars.isSaving.value" @click="planningPillars.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<div class="grid gap-4 md:grid-cols-3">
						<div
							v-for="pillar in planningPillars.data.value"
							:key="pillar.title"
							class="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
						>
							<div :class="[getColorClasses(pillar.bgColor).bg, getColorClasses(pillar.iconColor).text, 'mb-3 flex h-11 w-11 items-center justify-center rounded-full']">
								<UIcon :name="pillar.icon" class="h-5 w-5" />
							</div>
							<p class="text-base font-semibold text-[var(--app-text)]">{{ pillar.title }}</p>
							<p class="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{{ pillar.description }}</p>
						</div>
					</div>
					<ClientOnly v-if="planningPillars.isEditing.value">
						<div class="mt-6">
							<UiLazyFeatureCardsEditor v-model="planningPillars.data.value" />
						</div>
					</ClientOnly>
				</div>

				<div class="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
							{{ t("travel.intro.factsTitle") }}
						</p>
						<div class="flex items-center gap-2">
							<template v-if="routeFacts.canEdit.value && !routeFacts.isEditing.value">
								<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="routeFacts.startEditing()">
									Fakten bearbeiten
								</UButton>
							</template>
							<template v-else-if="routeFacts.isEditing.value">
								<UButton color="neutral" variant="ghost" size="sm" :disabled="routeFacts.isSaving.value" @click="routeFacts.cancelEditing()">
									{{ t("editor.cancel") }}
								</UButton>
								<UButton color="primary" icon="i-lucide-save" size="sm" :loading="routeFacts.isSaving.value" @click="routeFacts.save()">
									{{ t("editor.save") }}
								</UButton>
							</template>
						</div>
					</div>

					<ClientOnly v-if="routeFacts.isEditing.value">
						<UiLazyStatsEditor v-model="routeFacts.data.value" />
					</ClientOnly>
					<div v-else class="mt-6 grid gap-4">
						<div
							v-for="fact in routeFacts.data.value"
							:key="fact.label"
							class="border-b border-[var(--app-border)] pb-4 last:border-b-0 last:pb-0"
						>
							<div class="display-copy text-2xl md:text-3xl text-[var(--app-text)]">{{ fact.value }}</div>
							<div class="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">{{ fact.label }}</div>
						</div>
					</div>

					<div class="mt-6 rounded-[1.25rem] bg-[var(--app-surface-strong)] p-4">
						<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">
							Adresse
						</p>
						<p class="mt-2 text-base font-semibold text-[var(--app-text)]">{{ destinationAddress }}</p>
						<UButton
							:to="mapDirectionsUrl"
							target="_blank"
							size="lg"
							color="neutral"
							variant="soft"
							class="mt-4 rounded-full px-5"
							icon="i-lucide-map">
							Google Maps
						</UButton>
					</div>
				</div>
			</div>
		</section>

		<section class="mx-auto max-w-screen-xl px-4">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
				<div class="space-y-5">
					<UiTitle :subtitle="t('travel.lage.subtitle')" :title="t('travel.lage.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="lageContent.canEdit.value && !lageContent.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="lageContent.startEditing()">
								{{ t("editor.edit") }}
							</UButton>
						</template>
						<template v-else-if="lageContent.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="lageContent.isSaving.value" @click="lageContent.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="lageContent.isSaving.value" @click="lageContent.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<div v-if="lageContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="lageContent.isEditing.value && lageContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="lageContent.content.value" />
					</ClientOnly>
					<div
						v-else-if="lageContent.status.value !== 'pending'"
						class="prose max-w-none text-lg leading-relaxed dark:prose-invert"
						v-html="lageContent.content.value || defaultLage"
					/>

					<div class="grid gap-4">
						<div
							v-for="note in arrivalNotes"
							:key="note.title"
							class="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-2xl bg-[var(--app-primary)]/12 p-3 text-[var(--app-primary)]">
									<UIcon :name="note.icon" class="h-5 w-5" />
								</div>
								<div>
									<p class="font-semibold text-[var(--app-text)]">{{ note.title }}</p>
									<p class="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">{{ note.description }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-5">
					<div class="overflow-hidden rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)]">
						<iframe
							:src="mapEmbedUrl"
							title="Karte der Residence Beausoleil"
							class="h-[360px] w-full border-0"
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							allowfullscreen
						/>
					</div>

					<div class="flex items-center justify-end gap-2">
						<template v-if="locationFacts.canEdit.value && !locationFacts.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="locationFacts.startEditing()">
								Fakten bearbeiten
							</UButton>
						</template>
						<template v-else-if="locationFacts.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="locationFacts.isSaving.value" @click="locationFacts.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="locationFacts.isSaving.value" @click="locationFacts.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<ClientOnly v-if="locationFacts.isEditing.value">
						<UiLazyStatsEditor v-model="locationFacts.data.value" />
					</ClientOnly>
					<div v-else class="grid gap-4 sm:grid-cols-3">
						<div
							v-for="fact in locationFacts.data.value"
							:key="fact.label"
							class="rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
						>
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">{{ fact.label }}</p>
							<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ fact.value }}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="mx-auto max-w-screen-xl px-4">
			<div class="flex items-end justify-between gap-4 border-t border-[var(--app-border)] pt-16">
				<div>
					<p class="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-primary)]/90">
						{{ t("travel.intro.kicker") }}
					</p>
					<h2 class="display-copy mt-3 text-3xl md:text-5xl leading-[1.04] tracking-[-0.05em] text-[var(--app-text)]">
						{{ t("travel.intro.pillars.drive.title") }}, {{ t("travel.intro.pillars.train.title") }}, {{ t("travel.intro.pillars.flight.title") }}
					</h2>
				</div>
			</div>

			<div class="mt-8 grid gap-5 lg:grid-cols-3">
				<div
					v-for="mode in routeModeCards"
					:key="mode.id"
					class="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6"
				>
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-[var(--app-primary)]/12 p-3 text-[var(--app-primary)]">
							<UIcon :name="mode.icon" class="h-5 w-5" />
						</div>
						<div>
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">
								{{ mode.kicker }}
							</p>
							<p class="mt-1 text-xl font-semibold text-[var(--app-text)]">{{ mode.title }}</p>
						</div>
					</div>

					<p class="mt-4 text-sm font-semibold text-[var(--app-text)]">{{ mode.meta }}</p>
					<p class="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{{ mode.summary }}</p>

					<UButton
						:to="mode.ctaHref"
						:target="mode.ctaHref.startsWith('http') ? '_blank' : undefined"
						color="neutral"
						variant="soft"
						size="lg"
						class="mt-5 rounded-full px-5"
						:icon="mode.icon">
						{{ mode.ctaLabel }}
					</UButton>
				</div>
			</div>
		</section>

		<section id="mit-dem-auto" class="scroll-mt-32 mx-auto max-w-screen-xl border-t border-[var(--app-border)] px-4 pt-16">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
				<div class="space-y-6">
					<UiTitle :subtitle="t('travel.auto.subtitle')" :title="t('travel.auto.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="autoContent.canEdit.value && !autoContent.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="autoContent.startEditing()">
								{{ t("editor.edit") }}
							</UButton>
						</template>
						<template v-else-if="autoContent.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="autoContent.isSaving.value" @click="autoContent.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="autoContent.isSaving.value" @click="autoContent.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<div v-if="autoContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="autoContent.isEditing.value && autoContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="autoContent.content.value" />
					</ClientOnly>
					<div
						v-else-if="autoContent.status.value !== 'pending'"
						class="prose max-w-none text-lg leading-relaxed dark:prose-invert"
						v-html="autoContent.content.value || defaultAuto"
					/>

					<div class="flex flex-wrap gap-3">
						<UButton
							:to="mapDirectionsUrl"
							target="_blank"
							size="lg"
							color="neutral"
							variant="soft"
							class="rounded-full px-6"
							icon="i-lucide-map">
							{{ t("travel.auto.routeButton") }}
						</UButton>
					</div>
				</div>

				<div class="space-y-4 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
					<div class="flex items-center justify-between gap-3">
						<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">
							{{ t("travel.auto.routeTitle") }}
						</p>
						<div class="flex items-center gap-2">
							<template v-if="autoSteps.canEdit.value && !autoSteps.isEditing.value">
								<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="autoSteps.startEditing()">
									Stops bearbeiten
								</UButton>
							</template>
							<template v-else-if="autoSteps.isEditing.value">
								<UButton color="neutral" variant="ghost" size="sm" :disabled="autoSteps.isSaving.value" @click="autoSteps.cancelEditing()">
									{{ t("editor.cancel") }}
								</UButton>
								<UButton color="primary" icon="i-lucide-save" size="sm" :loading="autoSteps.isSaving.value" @click="autoSteps.save()">
									{{ t("editor.save") }}
								</UButton>
							</template>
						</div>
					</div>

					<ClientOnly v-if="autoSteps.isEditing.value">
						<UiLazyJourneyStepsEditor
							v-model="autoSteps.data.value"
							title-label="Route"
							detail-label="Hinweis"
							add-label="Stopp hinzufügen"
							title-placeholder="z.B. Bern – Lausanne – Geneve"
							detail-placeholder="z.B. Grenze Bardonnex Richtung Frankreich"
						/>
					</ClientOnly>
					<ol v-else class="space-y-4">
						<li
							v-for="(step, index) in autoSteps.data.value"
							:key="step.title"
							class="flex gap-4 border-b border-[var(--app-border)] pb-4 last:border-b-0 last:pb-0"
						>
							<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] text-sm font-semibold text-[var(--app-text)]">
								{{ index + 1 }}
							</div>
							<div>
								<p class="font-semibold text-[var(--app-text)]">{{ step.title }}</p>
								<p class="text-sm text-[var(--app-muted)]">{{ step.detail }}</p>
							</div>
						</li>
					</ol>

					<div class="flex items-center justify-between border-t border-[var(--app-border)] pt-4 text-sm">
						<span class="text-[var(--app-muted)]">{{ t("travel.auto.toll") }}</span>
						<span class="font-semibold text-[var(--app-text)]">{{ t("travel.auto.tollPrice") }}</span>
					</div>
				</div>
			</div>
		</section>

		<section id="mit-dem-zug" class="scroll-mt-32 mx-auto max-w-screen-xl border-t border-[var(--app-border)] px-4 pt-16">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
				<div class="space-y-6">
					<UiTitle :subtitle="t('travel.zug.subtitle')" :title="t('travel.zug.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="zugContent.canEdit.value && !zugContent.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="zugContent.startEditing()">
								{{ t("editor.edit") }}
							</UButton>
						</template>
						<template v-else-if="zugContent.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="zugContent.isSaving.value" @click="zugContent.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="zugContent.isSaving.value" @click="zugContent.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<div v-if="zugContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="zugContent.isEditing.value && zugContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="zugContent.content.value" />
					</ClientOnly>
					<div
						v-else-if="zugContent.status.value !== 'pending'"
						class="prose max-w-none text-lg leading-relaxed dark:prose-invert"
						v-html="zugContent.content.value || defaultZug"
					/>
				</div>

				<div class="space-y-4 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
					<div class="flex items-center justify-between gap-3">
						<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">
							{{ t("travel.zug.title") }}
						</p>
						<div class="flex items-center gap-2">
							<template v-if="trainSteps.canEdit.value && !trainSteps.isEditing.value">
								<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="trainSteps.startEditing()">
									Etappen bearbeiten
								</UButton>
							</template>
							<template v-else-if="trainSteps.isEditing.value">
								<UButton color="neutral" variant="ghost" size="sm" :disabled="trainSteps.isSaving.value" @click="trainSteps.cancelEditing()">
									{{ t("editor.cancel") }}
								</UButton>
								<UButton color="primary" icon="i-lucide-save" size="sm" :loading="trainSteps.isSaving.value" @click="trainSteps.save()">
									{{ t("editor.save") }}
								</UButton>
							</template>
						</div>
					</div>

					<ClientOnly v-if="trainSteps.isEditing.value">
						<UiLazyJourneyStepsEditor
							v-model="trainSteps.data.value"
							eyebrow-label="Etikett"
							title-label="Route"
							detail-label="Detail"
							add-label="Etappe hinzufügen"
							eyebrow-placeholder="z.B. Etappe 1"
							title-placeholder="z.B. Bern – Geneve"
							detail-placeholder="z.B. InterCity, ca. 1h 45min"
						/>
					</ClientOnly>
					<div v-else class="grid gap-4">
						<div
							v-for="step in trainSteps.data.value"
							:key="`${step.eyebrow}-${step.title}`"
							class="border-b border-[var(--app-border)] pb-4 last:border-b-0 last:pb-0"
						>
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">
								{{ step.eyebrow }}
							</p>
							<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ step.title }}</p>
							<p class="mt-1 text-sm text-[var(--app-muted)]">{{ step.detail }}</p>
						</div>
					</div>

					<div class="rounded-[1.25rem] bg-[var(--app-surface-strong)] p-4">
						<div class="flex items-start gap-3">
							<div class="rounded-2xl bg-[var(--app-primary)]/12 p-3 text-[var(--app-primary)]">
								<UIcon name="i-lucide-bus" class="h-5 w-5" />
							</div>
							<div>
								<p class="font-semibold text-[var(--app-text)]">{{ t("travel.zug.transfer") }}</p>
								<p class="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">{{ t("travel.zug.transferText") }}</p>
							</div>
						</div>

						<UButton
							to="https://www.reseaumistral.com/se-deplacer/lignes/ligne-bus-67"
							target="_blank"
							color="neutral"
							variant="soft"
							size="lg"
							class="mt-4 rounded-full px-5"
							icon="i-lucide-bus-front">
							{{ t("travel.zug.busButton") }}
						</UButton>
					</div>
				</div>
			</div>
		</section>

		<section id="mit-dem-flugzeug" class="scroll-mt-32 mx-auto max-w-screen-xl border-t border-[var(--app-border)] px-4 pt-16">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
				<div class="space-y-6">
					<UiTitle :subtitle="t('travel.flugzeug.subtitle')" :title="t('travel.flugzeug.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="flugzeugContent.canEdit.value && !flugzeugContent.isEditing.value">
							<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="flugzeugContent.startEditing()">
								{{ t("editor.edit") }}
							</UButton>
						</template>
						<template v-else-if="flugzeugContent.isEditing.value">
							<UButton color="neutral" variant="ghost" size="sm" :disabled="flugzeugContent.isSaving.value" @click="flugzeugContent.cancelEditing()">
								{{ t("editor.cancel") }}
							</UButton>
							<UButton color="primary" icon="i-lucide-save" size="sm" :loading="flugzeugContent.isSaving.value" @click="flugzeugContent.save()">
								{{ t("editor.save") }}
							</UButton>
						</template>
					</div>

					<div v-if="flugzeugContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="flugzeugContent.isEditing.value && flugzeugContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="flugzeugContent.content.value" />
					</ClientOnly>
					<div
						v-else-if="flugzeugContent.status.value !== 'pending'"
						class="prose max-w-none text-lg leading-relaxed dark:prose-invert"
						v-html="flugzeugContent.content.value || defaultFlugzeug"
					/>
				</div>

				<div class="space-y-4 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
					<div class="flex items-center justify-between gap-3">
						<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">
							{{ t("travel.flugzeug.title") }}
						</p>
						<div class="flex items-center gap-2">
							<template v-if="flightFacts.canEdit.value && !flightFacts.isEditing.value">
								<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="flightFacts.startEditing()">
									Infos bearbeiten
								</UButton>
							</template>
							<template v-else-if="flightFacts.isEditing.value">
								<UButton color="neutral" variant="ghost" size="sm" :disabled="flightFacts.isSaving.value" @click="flightFacts.cancelEditing()">
									{{ t("editor.cancel") }}
								</UButton>
								<UButton color="primary" icon="i-lucide-save" size="sm" :loading="flightFacts.isSaving.value" @click="flightFacts.save()">
									{{ t("editor.save") }}
								</UButton>
							</template>
						</div>
					</div>

					<div class="grid gap-4">
						<div
							v-for="item in flightFacts.data.value"
							:key="item.title"
							class="rounded-[1.25rem] border border-[var(--app-border)] p-4"
						>
							<div class="flex items-start gap-3">
								<div :class="[getColorClasses(item.bgColor).bg, getColorClasses(item.iconColor).text, 'rounded-2xl p-3']">
									<UIcon :name="item.icon" class="h-6 w-6" />
								</div>
								<div>
									<p class="font-semibold text-[var(--app-text)]">{{ item.title }}</p>
									<p class="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">{{ item.description }}</p>
								</div>
							</div>
						</div>
					</div>
					<ClientOnly v-if="flightFacts.isEditing.value">
						<div class="mt-6">
							<UiLazyFeatureCardsEditor v-model="flightFacts.data.value" />
						</div>
					</ClientOnly>
				</div>
			</div>
		</section>
	</div>
</template>

<style scoped>
.scroll-mt-32 {
	scroll-margin-top: 8rem;
}
</style>
