<script lang="ts" setup>
const { t } = useI18n();

const defaultLage = `<p>Unsere Ferienhäuser liegen idyllisch auf der Halbinsel von Giens an der Avenue des Arbanais 313, nur etwa 15 Gehminuten vom Strand und vom Dorfzentrum entfernt.</p><p>Die Halbinsel von Giens befindet sich bei etwa 43°2′ nördlicher Breite an der Côte d'Azur im Département Var und gehört zu den südlichen Regionen des französischen Festlands.</p><p>Ein großer Teil der Halbinsel ist als Naturschutzgebiet ausgewiesen und steht unter besonderem Schutz. Besonders die Salinen und Feuchtgebiete zwischen den beiden Sanddämmen (Tombolos) bilden ein wichtiges Rückzugsgebiet für Zug- und Brutvögel.</p>`;

const defaultAuto = `<p>Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und Pausen etwa 7 bis 8 Stunden.</p>`;

const defaultZug = `<p>Die Anreise mit dem Zug ist eine bequeme Alternative. SNCF bietet hervorragende Verbindungen mit dem TGV an, oft mit nur zwei Umstiegen ab der Schweiz.</p>`;

const defaultFlugzeug = `<p>Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für Kurztrips.</p><p>Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem Auto.</p>`;

const lageContent = await usePageContent("travel-lage");
const autoContent = await usePageContent("travel-auto");
const zugContent = await usePageContent("travel-zug");
const flugzeugContent = await usePageContent("travel-flugzeug");
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			:title="t('hero.travel.title')"
			:subtitle="t('hero.travel.subtitle')"
			src="/giens/hyeres.webp"
			alt="Blick auf Hyères und das Meer"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<!-- Lage Section -->
		<section class="max-w-screen-lg mx-auto px-4">
			<UiTitle :subtitle="t('travel.lage.subtitle')" :title="t('travel.lage.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="lageContent.isAdmin.value && !lageContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="lageContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="lageContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="lageContent.cancelEditing()"
						:disabled="lageContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="lageContent.isSaving.value"
						@click="lageContent.save()"
					>
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
				class="mt-8 prose dark:prose-invert max-w-none text-lg"
				v-html="lageContent.content.value || defaultLage"
			/>
		</section>

		<!-- Quick Links -->
		<section class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-screen-lg mx-auto px-4">
			<UiTravelCard to="#mit-dem-auto" :title="t('travel.quickLinks.auto')" icon="i-lucide-car" />
			<UiTravelCard to="#mit-dem-zug" :title="t('travel.quickLinks.zug')" icon="i-lucide-train-front" />
			<UiTravelCard to="#mit-dem-flugzeug" :title="t('travel.quickLinks.flugzeug')" icon="i-lucide-plane" />
		</section>

		<!-- Details: Auto -->
		<section id="mit-dem-auto" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.auto.subtitle')" :title="t('travel.auto.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="autoContent.isAdmin.value && !autoContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="autoContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="autoContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="autoContent.cancelEditing()"
						:disabled="autoContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="autoContent.isSaving.value"
						@click="autoContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div class="grid md:grid-cols-2 gap-12 items-start mt-12">
				<div class="space-y-8">
					<div v-if="autoContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="autoContent.isEditing.value && autoContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="autoContent.content.value" />
					</ClientOnly>
					<div
						v-else-if="autoContent.status.value !== 'pending'"
						class="text-lg text-stone-700 dark:text-stone-300 prose dark:prose-invert max-w-none"
						v-html="autoContent.content.value || defaultAuto"
					/>

					<UButton
						v-if="!autoContent.isEditing.value"
						to="https://www.google.com/maps/dir/?api=1&destination=Lotissement+Beausoleil,+Hyeres"
						target="_blank"
						size="xl"
						color="neutral"
						class="rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
						icon="i-lucide-map">
						{{ t("travel.auto.routeButton") }}
					</UButton>

					<div
						v-if="!autoContent.isEditing.value"
						class="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border-l-8 border-primary shadow-sm flex gap-4">
						<UIcon name="i-lucide-info" class="w-8 h-8 text-primary shrink-0" />
						<p class="italic text-base">
							<strong>{{ t("travel.auto.tip") }}</strong> {{ t("travel.auto.tipText") }}
						</p>
					</div>
				</div>
				<div class="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
					<h3 class="text-xl font-bold mb-6 flex items-center gap-2">
						<UIcon name="i-lucide-map-pin" class="text-primary" />
						{{ t("travel.auto.routeTitle") }}
					</h3>
					<ul class="space-y-6 text-base">
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>1</span
							>
							<div>
								<span class="font-bold">Bern – Lausanne – Genève</span>
								<p class="text-sm text-stone-500">Zoll Richtung France (Bardonnex)</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>2</span
							>
							<div>
								<span class="font-bold">Annecy – Chambéry – Grenoble</span>
								<p class="text-sm text-stone-500">A41/A43/A48</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>3</span
							>
							<div>
								<span class="font-bold">Valence – Orange – Aix</span>
								<p class="text-sm text-stone-500">A49/A7/A8</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>4</span
							>
							<div>
								<span class="font-bold">Toulon – Hyères – Giens</span>
								<p class="text-sm text-stone-500">A52/A50/A570</p>
							</div>
						</li>
					</ul>
					<div class="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
						<div class="flex justify-between items-center text-sm text-stone-500">
							<span>{{ t("travel.auto.toll") }}</span>
							<span class="font-bold text-gray-900 dark:text-white">{{ t("travel.auto.tollPrice") }}</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Details: Zug -->
		<section id="mit-dem-zug" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.zug.subtitle')" :title="t('travel.zug.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="zugContent.isAdmin.value && !zugContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="zugContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="zugContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="zugContent.cancelEditing()"
						:disabled="zugContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="zugContent.isSaving.value"
						@click="zugContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div
				class="mt-12 bg-white dark:bg-gray-950 rounded-3xl border border-stone-100 dark:border-stone-800 overflow-hidden shadow-xl">
				<div class="p-8 md:p-12">
					<div v-if="zugContent.status.value === 'pending'" class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
					<ClientOnly v-if="zugContent.isEditing.value && zugContent.status.value !== 'pending'">
						<TiptapLazyEditor v-model="zugContent.content.value" />
					</ClientOnly>
					<div v-else-if="zugContent.status.value !== 'pending'">
						<p class="text-xl mb-12 text-stone-700 dark:text-stone-300" v-html="zugContent.content.value || defaultZug" />
						<div class="grid md:grid-cols-3 gap-8 relative">
							<div class="space-y-2 relative">
								<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 1</div>
								<div class="font-bold text-xl">Bern – Genève</div>
								<p class="text-sm text-stone-500">InterCity, ca. 1h 45min</p>
							</div>
							<div class="space-y-2 border-l border-stone-100 dark:border-stone-800 md:pl-8">
								<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 2</div>
								<div class="font-bold text-xl">Genève – Marseille</div>
								<p class="text-sm text-stone-500">TGV Lyria, ca. 4h 30min</p>
							</div>
							<div class="space-y-2 border-l border-stone-100 dark:border-stone-800 md:pl-8">
								<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 3</div>
								<div class="font-bold text-xl">Marseille – Hyères</div>
								<p class="text-sm text-stone-500">Regionalzug TER, ca. 1h</p>
							</div>
						</div>
					</div>
				</div>
				<div
					v-if="!zugContent.isEditing.value"
					class="bg-neutral-900 dark:bg-black p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
					<div class="flex items-center gap-4">
						<div class="p-3 bg-white/10 rounded-xl">
							<UIcon name="i-lucide-bus" class="w-8 h-8 text-white" />
						</div>
						<div>
							<span class="font-bold block text-lg text-white">{{ t("travel.zug.transfer") }}</span>
							<span class="text-white/80">{{ t("travel.zug.transferText") }}</span>
						</div>
					</div>
					<div class="flex gap-4">
						<UButton
							to="https://www.reseaumistral.com/se-deplacer/lignes/ligne-bus-67"
							target="_blank"
							color="neutral"
							variant="solid"
							size="xl"
							class="rounded-full px-8 bg-white text-neutral-900 hover:bg-gray-100 border-none"
							icon="i-lucide-bus-front"
							>{{ t("travel.zug.busButton") }}</UButton
						>
					</div>
				</div>
			</div>
		</section>

		<!-- Details: Flugzeug -->
		<section id="mit-dem-flugzeug" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.flugzeug.subtitle')" :title="t('travel.flugzeug.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="flugzeugContent.isAdmin.value && !flugzeugContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="flugzeugContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="flugzeugContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="flugzeugContent.cancelEditing()"
						:disabled="flugzeugContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="flugzeugContent.isSaving.value"
						@click="flugzeugContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div class="grid md:grid-cols-2 gap-12 mt-12 items-center">
				<div v-if="flugzeugContent.status.value === 'pending'" class="flex justify-center py-8">
					<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
				<ClientOnly v-if="flugzeugContent.isEditing.value && flugzeugContent.status.value !== 'pending'">
					<TiptapLazyEditor v-model="flugzeugContent.content.value" />
				</ClientOnly>
				<div
					v-else-if="flugzeugContent.status.value !== 'pending'"
					class="prose dark:prose-invert max-w-none text-lg"
					v-html="flugzeugContent.content.value || defaultFlugzeug"
				/>
				<div v-if="!flugzeugContent.isEditing.value" class="grid grid-cols-1 gap-4">
					<div
						class="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm flex items-center gap-6">
						<div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-primary">
							<UIcon name="i-lucide-plane-takeoff" class="w-10 h-10" />
						</div>
						<div>
							<div class="text-lg font-bold">{{ t("travel.flugzeug.directFlights") }}</div>
							<div class="text-stone-500">{{ t("travel.flugzeug.directFlightsText") }}</div>
						</div>
					</div>
					<div
						class="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm flex items-center gap-6">
						<div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-secondary">
							<UIcon name="i-lucide-car-front" class="w-10 h-10" />
						</div>
						<div>
							<div class="text-lg font-bold">{{ t("travel.flugzeug.rentalCar") }}</div>
							<div class="text-stone-500">{{ t("travel.flugzeug.rentalCarText") }}</div>
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
