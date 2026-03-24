<script lang="ts" setup>
const { t } = useI18n();

const defaultLage = `<p>Unsere Ferienhäuser liegen idyllisch auf der Halbinsel von Giens an der Avenue des Arbanais 313, nur etwa 15 Gehminuten vom Strand und vom Dorfzentrum entfernt.</p><p>Die Halbinsel von Giens befindet sich bei etwa 43°2′ nördlicher Breite an der Côte d'Azur im Département Var und gehört zu den südlichen Regionen des französischen Festlands.</p><p>Ein großer Teil der Halbinsel ist als Naturschutzgebiet ausgewiesen und steht unter besonderem Schutz. Besonders die Salinen und Feuchtgebiete zwischen den beiden Sanddämmen (Tombolos) bilden ein wichtiges Rückzugsgebiet für Zug- und Brutvögel.</p>`;

const defaultAuto = `<p>Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und Pausen etwa 7 bis 8 Stunden.</p>`;

const defaultZug = `<p>Die Anreise mit dem Zug ist eine bequeme Alternative. SNCF bietet hervorragende Verbindungen mit dem TGV an, oft mit nur zwei Umstiegen ab der Schweiz.</p>`;

const defaultFlugzeug = `<p>Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für Kurztrips.</p><p>Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem Auto.</p>`;

const routeFacts = computed(() => [
	{ value: "700 km", label: t("travel.intro.facts.distance") },
	{ value: "7-8 h", label: t("travel.intro.facts.drive") },
	{ value: "15 min", label: t("travel.intro.facts.airport") },
]);

const planningPillars = computed(() => [
	{
		title: t("travel.intro.pillars.drive.title"),
		description: t("travel.intro.pillars.drive.description"),
		icon: "i-lucide-car",
	},
	{
		title: t("travel.intro.pillars.train.title"),
		description: t("travel.intro.pillars.train.description"),
		icon: "i-lucide-train-front",
	},
	{
		title: t("travel.intro.pillars.flight.title"),
		description: t("travel.intro.pillars.flight.description"),
		icon: "i-lucide-plane",
	},
]);

const routeLinks = computed(() => [
	{ id: "mit-dem-auto", icon: "i-lucide-car", label: t("travel.quickLinks.auto") },
	{ id: "mit-dem-zug", icon: "i-lucide-train-front", label: t("travel.quickLinks.zug") },
	{ id: "mit-dem-flugzeug", icon: "i-lucide-plane", label: t("travel.quickLinks.flugzeug") },
]);

const autoSteps = [
	{
		title: "Bern – Lausanne – Genève",
		detail: "Grenze Bardonnex Richtung Frankreich",
	},
	{
		title: "Annecy – Chambéry – Grenoble",
		detail: "A41 / A43 / A48",
	},
	{
		title: "Valence – Orange – Aix",
		detail: "A49 / A7 / A8",
	},
	{
		title: "Toulon – Hyères – Giens",
		detail: "A52 / A50 / A570",
	},
];

const trainSteps = [
	{ label: "Etappe 1", route: "Bern – Genève", detail: "InterCity, ca. 1h 45min" },
	{ label: "Etappe 2", route: "Genève – Marseille", detail: "TGV Lyria, ca. 4h 30min" },
	{ label: "Etappe 3", route: "Marseille – Hyères", detail: "TER, ca. 1h" },
];

const flightFacts = computed(() => [
	{
		icon: "i-lucide-plane-takeoff",
		title: t("travel.flugzeug.directFlights"),
		description: t("travel.flugzeug.directFlightsText"),
	},
	{
		icon: "i-lucide-car-front",
		title: t("travel.flugzeug.rentalCar"),
		description: t("travel.flugzeug.rentalCarText"),
	},
]);

const lageContent = await usePageContent("travel-lage");
const autoContent = await usePageContent("travel-auto");
const zugContent = await usePageContent("travel-zug");
const flugzeugContent = await usePageContent("travel-flugzeug");
</script>

<template>
	<div class="space-y-20 pb-20">
		<UiHero
			:title="t('hero.travel.title')"
			:subtitle="t('hero.travel.subtitle')"
			src="/giens/hyeres.webp"
			alt="Blick auf Hyères und das Meer"
			height="h-[40vh] md:h-[52vh] min-h-[300px] md:min-h-[420px]"
			content-class="max-w-3xl"
		/>

		<section class="mx-auto grid max-w-screen-xl gap-10 border-b border-[var(--app-border)] px-4 pb-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
			<div class="space-y-6">
				<div class="space-y-4">
					<p class="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-primary)]/90">
						{{ t("travel.intro.kicker") }}
					</p>
					<h2 class="display-copy max-w-4xl text-3xl md:text-5xl leading-[1.04] tracking-[-0.05em] text-[var(--app-text)]">
						{{ t("travel.intro.lead") }}
					</h2>
					<p class="max-w-3xl text-base md:text-lg leading-relaxed text-[var(--app-muted)]">
						{{ t("travel.intro.body") }}
					</p>
				</div>

				<div class="grid gap-4 md:grid-cols-3">
					<div
						v-for="pillar in planningPillars"
						:key="pillar.title"
						class="border-t border-[var(--app-border)] pt-4"
					>
						<div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-primary)]/10 text-[var(--app-primary)]">
							<UIcon :name="pillar.icon" class="h-5 w-5" />
						</div>
						<p class="text-base font-semibold text-[var(--app-text)]">{{ pillar.title }}</p>
						<p class="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{{ pillar.description }}</p>
					</div>
				</div>
			</div>

			<div class="space-y-5 border-l-0 lg:border-l lg:border-[var(--app-border)] lg:pl-8">
				<p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
					{{ t("travel.intro.factsTitle") }}
				</p>
				<div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
					<div
						v-for="fact in routeFacts"
						:key="fact.label"
						class="border-b border-[var(--app-border)] pb-4 last:border-b-0 last:pb-0">
						<div class="display-copy text-2xl md:text-3xl text-[var(--app-text)]">{{ fact.value }}</div>
						<div class="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">{{ fact.label }}</div>
					</div>
				</div>
			</div>
		</section>

		<section class="mx-auto max-w-screen-xl px-4">
			<div class="flex flex-wrap gap-3 border-b border-[var(--app-border)] pb-6">
				<a
					v-for="link in routeLinks"
					:key="link.id"
					:href="`#${link.id}`"
					class="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-primary)]/45 hover:text-[var(--app-primary)]">
					<UIcon :name="link.icon" class="h-4 w-4" />
					{{ link.label }}
				</a>
			</div>
		</section>

		<section class="mx-auto max-w-screen-xl px-4">
			<div class="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
				<div class="space-y-5">
					<UiTitle :subtitle="t('travel.lage.subtitle')" :title="t('travel.lage.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="lageContent.isAdmin.value && !lageContent.isEditing.value">
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
				</div>

				<div class="grid gap-6">
					<div class="overflow-hidden rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface)]">
					<img
						src="/giens/giens-aerial.webp"
						alt="Landschaft der Halbinsel Giens"
						class="h-[320px] w-full object-cover"
						loading="lazy"
					/>
					</div>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="border-t border-[var(--app-border)] pt-4">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">{{ t("travel.locationFacts.walk.label") }}</p>
							<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ t("travel.locationFacts.walk.value") }}</p>
						</div>
						<div class="border-t border-[var(--app-border)] pt-4">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">{{ t("travel.locationFacts.port.label") }}</p>
							<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ t("travel.locationFacts.port.value") }}</p>
						</div>
						<div class="border-t border-[var(--app-border)] pt-4">
							<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">{{ t("travel.locationFacts.nature.label") }}</p>
							<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ t("travel.locationFacts.nature.value") }}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section id="mit-dem-auto" class="scroll-mt-32 border-t border-[var(--app-border)] pt-16">
			<div class="mx-auto max-w-screen-xl px-4">
				<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
					<div class="space-y-6">
						<UiTitle :subtitle="t('travel.auto.subtitle')" :title="t('travel.auto.title')" />

						<div class="flex items-center justify-end gap-2">
							<template v-if="autoContent.isAdmin.value && !autoContent.isEditing.value">
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
								v-if="!autoContent.isEditing.value"
								to="https://www.google.com/maps/dir/?api=1&destination=Lotissement+Beausoleil,+Hyeres"
								target="_blank"
								size="lg"
								color="neutral"
								variant="soft"
								class="rounded-full px-6"
								icon="i-lucide-map">
								{{ t("travel.auto.routeButton") }}
							</UButton>
						</div>

						<div
							v-if="!autoContent.isEditing.value"
							class="max-w-3xl border-l-2 border-[var(--app-accent)] pl-4 text-sm leading-relaxed text-[var(--app-muted)]">
							<strong class="text-[var(--app-text)]">{{ t("travel.auto.tip") }}</strong> {{ t("travel.auto.tipText") }}
						</div>
					</div>

					<div class="space-y-4">
						<p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[var(--app-primary)]">
							{{ t("travel.auto.routeTitle") }}
						</p>
						<ol class="space-y-4">
							<li
								v-for="(step, index) in autoSteps"
								:key="step.title"
								class="flex gap-4 border-b border-[var(--app-border)] pb-4 last:border-b-0 last:pb-0">
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
			</div>
		</section>

		<section id="mit-dem-zug" class="scroll-mt-32 border-t border-[var(--app-border)] pt-16">
			<div class="mx-auto max-w-screen-xl px-4">
				<div class="space-y-6">
					<UiTitle :subtitle="t('travel.zug.subtitle')" :title="t('travel.zug.title')" />

					<div class="flex items-center justify-end gap-2">
						<template v-if="zugContent.isAdmin.value && !zugContent.isEditing.value">
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
						class="max-w-3xl text-lg leading-relaxed text-[var(--app-muted)] prose dark:prose-invert"
						v-html="zugContent.content.value || defaultZug"
					/>

					<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.5fr)]">
						<div class="grid gap-4 md:grid-cols-3">
							<div
								v-for="step in trainSteps"
								:key="step.route"
								class="border-t border-[var(--app-border)] pt-4">
								<p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-primary)]">
									{{ step.label }}
								</p>
								<p class="mt-2 text-lg font-semibold text-[var(--app-text)]">{{ step.route }}</p>
								<p class="mt-1 text-sm text-[var(--app-muted)]">{{ step.detail }}</p>
							</div>
						</div>

						<div class="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
							<div class="flex items-start gap-3">
								<div class="rounded-2xl bg-[var(--app-primary)]/12 p-3 text-[var(--app-primary)]">
									<UIcon name="i-lucide-bus" class="h-6 w-6" />
								</div>
								<div class="space-y-1">
									<p class="font-semibold text-[var(--app-text)]">{{ t("travel.zug.transfer") }}</p>
									<p class="text-sm leading-relaxed text-[var(--app-muted)]">{{ t("travel.zug.transferText") }}</p>
								</div>
							</div>

							<UButton
								v-if="!zugContent.isEditing.value"
								to="https://www.reseaumistral.com/se-deplacer/lignes/ligne-bus-67"
								target="_blank"
								color="neutral"
								variant="soft"
								size="lg"
								class="mt-5 rounded-full px-5"
								icon="i-lucide-bus-front">
								{{ t("travel.zug.busButton") }}
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section id="mit-dem-flugzeug" class="scroll-mt-32 border-t border-[var(--app-border)] pt-16">
			<div class="mx-auto max-w-screen-xl px-4">
				<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
					<div class="space-y-6">
						<UiTitle :subtitle="t('travel.flugzeug.subtitle')" :title="t('travel.flugzeug.title')" />

						<div class="flex items-center justify-end gap-2">
							<template v-if="flugzeugContent.isAdmin.value && !flugzeugContent.isEditing.value">
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

					<div class="space-y-4">
						<div
							v-for="item in flightFacts"
							:key="item.title"
							class="border-t border-[var(--app-border)] pt-4">
							<div class="flex items-start gap-3">
								<div class="rounded-2xl bg-[var(--app-accent)]/14 p-3 text-[var(--app-accent)]">
									<UIcon :name="item.icon" class="h-6 w-6" />
								</div>
								<div>
									<p class="font-semibold text-[var(--app-text)]">{{ item.title }}</p>
									<p class="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">{{ item.description }}</p>
								</div>
							</div>
						</div>
					</div>
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
