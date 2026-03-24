<script lang="ts" setup>
const { t } = useI18n();

const defaultLage = `<p>Unsere Ferienhäuser liegen idyllisch auf der Halbinsel von Giens an der Avenue des Arbanais 313, nur etwa 15 Gehminuten vom Strand und vom Dorfzentrum entfernt.</p><p>Die Halbinsel von Giens befindet sich bei etwa 43°2′ nördlicher Breite an der Côte d'Azur im Département Var und gehört zu den südlichen Regionen des französischen Festlands.</p><p>Ein großer Teil der Halbinsel ist als Naturschutzgebiet ausgewiesen und steht unter besonderem Schutz. Besonders die Salinen und Feuchtgebiete zwischen den beiden Sanddämmen (Tombolos) bilden ein wichtiges Rückzugsgebiet für Zug- und Brutvögel.</p>`;

const defaultAuto = `<p>Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und Pausen etwa 7 bis 8 Stunden.</p>`;

const defaultZug = `<p>Die Anreise mit dem Zug ist eine bequeme Alternative. SNCF bietet hervorragende Verbindungen mit dem TGV an, oft mit nur zwei Umstiegen ab der Schweiz.</p>`;

const defaultFlugzeug = `<p>Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für Kurztrips.</p><p>Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem Auto.</p>`;

const defaultFreizeit = `<p>Die Halbinsel von Giens bietet ein breites Angebot an Freizeitaktivitäten für jeden Geschmack.</p>`;

const defaultMaerkte = `<p>In der Region gibt es jeden Tag der Woche einen Markt – frische Produkte direkt vom Erzeuger.</p>`;

const defaultEinkauf = `<p>Für den täglichen Bedarf finden Sie in der Umgebung alles Wichtige.</p>`;

const defaultAusfluege = `<p>Von Giens aus erreichen Sie bequem traumhafte Ausflugsziele.</p>`;

const lageContent = await usePageContent("travel-lage");
const autoContent = await usePageContent("travel-auto");
const zugContent = await usePageContent("travel-zug");
const flugzeugContent = await usePageContent("travel-flugzeug");
const freizeitContent = await usePageContent("travel-freizeit");
const maerkteContent = await usePageContent("travel-maerkte");
const einkaufContent = await usePageContent("travel-einkauf");
const ausfluegeContent = await usePageContent("travel-ausfluege");
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
			<ClientOnly v-else>
				<TiptapEditor v-if="lageContent.isEditing.value" v-model="lageContent.content.value" />
				<div
					v-else
					class="mt-8 prose dark:prose-invert max-w-none text-lg"
					v-html="lageContent.content.value || defaultLage"
				/>
			</ClientOnly>
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
					<ClientOnly v-else>
						<TiptapEditor v-if="autoContent.isEditing.value" v-model="autoContent.content.value" />
						<div
							v-else
							class="text-lg text-stone-700 dark:text-stone-300 prose dark:prose-invert max-w-none"
							v-html="autoContent.content.value || defaultAuto"
						/>
					</ClientOnly>

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
					<ClientOnly v-else>
						<TiptapEditor v-if="zugContent.isEditing.value" v-model="zugContent.content.value" />
						<div v-else>
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
					</ClientOnly>
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
				<ClientOnly v-else>
					<TiptapEditor v-if="flugzeugContent.isEditing.value" v-model="flugzeugContent.content.value" />
					<div
						v-else
						class="prose dark:prose-invert max-w-none text-lg"
						v-html="flugzeugContent.content.value || defaultFlugzeug"
					/>
				</ClientOnly>
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

		<!-- Freizeit & Sport Section -->
		<section id="freizeit" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.freizeit.subtitle')" :title="t('travel.freizeit.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="freizeitContent.isAdmin.value && !freizeitContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="freizeitContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="freizeitContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="freizeitContent.cancelEditing()"
						:disabled="freizeitContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="freizeitContent.isSaving.value"
						@click="freizeitContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="freizeitContent.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<TiptapEditor v-if="freizeitContent.isEditing.value" v-model="freizeitContent.content.value" />
				<div v-else>
					<div class="prose dark:prose-invert max-w-none mb-8" v-html="freizeitContent.content.value || defaultFreizeit" />
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
						<div class="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
							<div class="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit rounded-xl mb-4">
								<UIcon name="i-lucide-sailboat" class="w-6 h-6" />
							</div>
							<h3 class="font-bold text-lg mb-2">{{ t("travel.freizeit.wassersport.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.freizeit.wassersport.description") }}
							</p>
						</div>
						<div class="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
							<div class="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-fit rounded-xl mb-4">
								<UIcon name="i-lucide-footprints" class="w-6 h-6" />
							</div>
							<h3 class="font-bold text-lg mb-2">{{ t("travel.freizeit.wandern.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.freizeit.wandern.description") }}
							</p>
						</div>
						<div class="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
							<div class="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-fit rounded-xl mb-4">
								<UIcon name="i-lucide-waves" class="w-6 h-6" />
							</div>
							<h3 class="font-bold text-lg mb-2">{{ t("travel.freizeit.tauchen.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.freizeit.tauchen.description") }}
							</p>
						</div>
					</div>
				</div>
			</ClientOnly>
		</section>

		<!-- Wochenmärkte Section -->
		<section id="maerkte" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.maerkte.subtitle')" :title="t('travel.maerkte.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="maerkteContent.isAdmin.value && !maerkteContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="maerkteContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="maerkteContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="maerkteContent.cancelEditing()"
						:disabled="maerkteContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="maerkteContent.isSaving.value"
						@click="maerkteContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="maerkteContent.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<TiptapEditor v-if="maerkteContent.isEditing.value" v-model="maerkteContent.content.value" />
				<div v-else>
					<div class="prose dark:prose-invert max-w-none mb-8" v-html="maerkteContent.content.value || defaultMaerkte" />
					<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-8">
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.tue") }}</div>
							<div class="font-bold">Giens</div>
						</div>
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.wed") }}</div>
							<div class="font-bold">L'Ayguade</div>
						</div>
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.thu") }}</div>
							<div class="font-bold">Carqueiranne</div>
						</div>
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.fri") }}</div>
							<div class="font-bold">La Capte</div>
						</div>
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.sat") }}</div>
							<div class="font-bold">Hyères</div>
						</div>
						<div class="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.sun") }}</div>
							<div class="font-bold">Hyères-Port</div>
						</div>
						<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
							<div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ t("travel.maerkte.days.sun") }}</div>
							<div class="font-bold text-sm">La Londe</div>
						</div>
					</div>
					<p class="text-stone-500 text-sm mt-4 text-center">
						{{ t("travel.maerkte.fleaMarket") }}
					</p>
				</div>
			</ClientOnly>
		</section>

		<!-- Einkaufsmöglichkeiten Section -->
		<section id="einkauf" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.einkauf.subtitle')" :title="t('travel.einkauf.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="einkaufContent.isAdmin.value && !einkaufContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="einkaufContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="einkaufContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="einkaufContent.cancelEditing()"
						:disabled="einkaufContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="einkaufContent.isSaving.value"
						@click="einkaufContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="einkaufContent.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<TiptapEditor v-if="einkaufContent.isEditing.value" v-model="einkaufContent.content.value" />
				<div v-else>
					<div class="prose dark:prose-invert max-w-none mb-8" v-html="einkaufContent.content.value || defaultEinkauf" />
					<div class="grid md:grid-cols-2 gap-8 mt-8">
						<div class="space-y-4">
							<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-start gap-4">
								<UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary mt-0.5" />
								<div>
									<h4 class="font-bold">{{ t("travel.einkauf.giens.title") }}</h4>
									<p class="text-stone-500 text-sm">{{ t("travel.einkauf.giens.description") }}</p>
								</div>
							</div>
							<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-start gap-4">
								<UIcon name="i-lucide-croissant" class="w-5 h-5 text-primary mt-0.5" />
								<div>
									<h4 class="font-bold">{{ t("travel.einkauf.bakery.title") }}</h4>
									<p class="text-stone-500 text-sm">{{ t("travel.einkauf.bakery.description") }}</p>
								</div>
							</div>
							<div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-start gap-4">
								<UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary mt-0.5" />
								<div>
									<h4 class="font-bold">{{ t("travel.einkauf.hyeres.title") }}</h4>
									<p class="text-stone-500 text-sm">{{ t("travel.einkauf.hyeres.description") }}</p>
								</div>
							</div>
						</div>
						<div class="p-6 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
							<div class="flex items-center gap-3 mb-4">
								<UIcon name="i-lucide-washing-machine" class="w-6 h-6 text-primary" />
								<h4 class="font-bold text-lg">{{ t("travel.einkauf.laundry.title") }}</h4>
							</div>
							<p class="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
								{{ t("travel.einkauf.laundry.description") }}
							</p>
						</div>
					</div>
				</div>
			</ClientOnly>
		</section>

		<!-- Ausflüge Section -->
		<section id="ausfluege" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.ausfluege.subtitle')" :title="t('travel.ausfluege.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="ausfluegeContent.isAdmin.value && !ausfluegeContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						size="sm"
						@click="ausfluegeContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="ausfluegeContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="ausfluegeContent.cancelEditing()"
						:disabled="ausfluegeContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						size="sm"
						:loading="ausfluegeContent.isSaving.value"
						@click="ausfluegeContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="ausfluegeContent.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<ClientOnly v-else>
				<TiptapEditor v-if="ausfluegeContent.isEditing.value" v-model="ausfluegeContent.content.value" />
				<div v-else>
					<div class="prose dark:prose-invert max-w-none mb-8" v-html="ausfluegeContent.content.value || defaultAusfluege" />
					<div class="grid md:grid-cols-3 gap-6 mt-8">
						<div class="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-100 dark:border-blue-900">
							<UIcon name="i-lucide-map" class="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
							<h3 class="font-bold text-lg mb-2">{{ t("travel.ausfluege.porquerolles.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.ausfluege.porquerolles.description") }}
							</p>
						</div>
						<div class="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-100 dark:border-green-900">
							<UIcon name="i-lucide-trees" class="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
							<h3 class="font-bold text-lg mb-2">{{ t("travel.ausfluege.portCros.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.ausfluege.portCros.description") }}
							</p>
						</div>
						<div class="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-100 dark:border-amber-900">
							<UIcon name="i-lucide-sun" class="w-8 h-8 text-amber-600 dark:text-amber-400 mb-4" />
							<h3 class="font-bold text-lg mb-2">{{ t("travel.ausfluege.levant.title") }}</h3>
							<p class="text-stone-500 text-sm">
								{{ t("travel.ausfluege.levant.description") }}
							</p>
						</div>
					</div>
				</div>
			</ClientOnly>
		</section>
	</div>
</template>

<style scoped>
.scroll-mt-32 {
	scroll-margin-top: 8rem;
}
</style>
