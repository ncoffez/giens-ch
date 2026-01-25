<script lang="ts" setup></script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			title="Anreise nach Giens"
			subtitle="Tipps für eine entspannte Reise in den Süden."
			src="/giens/hyeres.webp"
			alt="Blick auf Hyères und das Meer" />

		<!-- Quick Links -->
		<section class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-screen-lg mx-auto px-4">
			<UiTravelCard to="#mit-dem-auto" title="Mit dem Auto" icon="i-lucide-car" />
			<UiTravelCard to="#mit-dem-zug" title="Mit dem Zug" icon="i-lucide-train-front" />
			<UiTravelCard to="#mit-dem-flugzeug" title="Mit dem Flugzeug" icon="i-lucide-plane" />
		</section>

		<!-- Details: Auto -->
		<section id="mit-dem-auto" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle subtitle="Ab Bern via Autobahn" title="Mit dem Auto" />
			<div class="grid md:grid-cols-2 gap-12 items-start mt-12">
				<div class="space-y-6 text-lg text-gray-700 dark:text-gray-300">
					<p>
						Die Anreise mit dem Auto ab Bern ist für viele Bewohner des Lotissement Beausoleil eine bevorzugte Option. Die
						Strecke führt hauptsächlich über Autobahnen und beträgt etwa 700 km. Die Fahrtzeit beträgt je nach Verkehr und
						Pausen etwa 7 bis 8 Stunden.
					</p>
					<div
						class="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border-l-8 border-primary shadow-sm flex gap-4">
						<UIcon name="i-lucide-info" class="w-8 h-8 text-primary shrink-0" />
						<p class="italic text-base">
							<strong>Tipp:</strong> Während der Sommerferien (Juli/August) ist die Strecke zwischen Valence und Orange
							oft stark befahren. Samstage sind dann besonders staubelastet.
						</p>
					</div>
				</div>
				<div class="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
					<h3 class="text-xl font-bold mb-6 flex items-center gap-2">
						<UIcon name="i-lucide-map-pin" class="text-primary" />
						Route auf einen Blick
					</h3>
					<ul class="space-y-6 text-base">
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>1</span
							>
							<div>
								<span class="font-bold">Bern – Lausanne – Genève</span>
								<p class="text-sm text-gray-500">Zoll Richtung France (Bardonnex)</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>2</span
							>
							<div>
								<span class="font-bold">Annecy – Chambéry – Grenoble</span>
								<p class="text-sm text-gray-500">A41/A43/A48</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>3</span
							>
							<div>
								<span class="font-bold">Valence – Orange – Aix</span>
								<p class="text-sm text-gray-500">A49/A7/A8</p>
							</div>
						</li>
						<li class="flex gap-4 items-start">
							<span
								class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shrink-0 text-sm"
								>4</span
							>
							<div>
								<span class="font-bold">Toulon – Hyères – Giens</span>
								<p class="text-sm text-gray-500">A52/A50/A570</p>
							</div>
						</li>
					</ul>
					<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
						<div class="flex justify-between items-center text-sm text-gray-500">
							<span>Autobahngebühren (Péage)</span>
							<span class="font-bold text-gray-900 dark:text-white">ca. 60 €</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Details: Zug -->
		<section id="mit-dem-zug" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle subtitle="Umweltfreundlich & entspannt" title="Mit dem Zug" />
			<div
				class="mt-12 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl">
				<div class="p-8 md:p-12">
					<p class="text-xl mb-12 text-gray-700 dark:text-gray-300">
						Die Anreise mit dem Zug ist eine bequeme Alternative. Die SBB und SNCF bieten hervorragende Verbindungen
						an, oft mit nur zwei Umstiegen.
					</p>
					<div class="grid md:grid-cols-3 gap-8 relative">
						<div class="space-y-2 relative">
							<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 1</div>
							<div class="font-bold text-xl">Bern – Genève</div>
							<p class="text-sm text-gray-500">InterCity, ca. 1h 45min</p>
						</div>
						<div class="space-y-2 border-l border-gray-100 dark:border-gray-800 md:pl-8">
							<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 2</div>
							<div class="font-bold text-xl">Genève – Marseille</div>
							<p class="text-sm text-gray-500">TGV Lyria, ca. 4h 30min</p>
						</div>
						<div class="space-y-2 border-l border-gray-100 dark:border-gray-800 md:pl-8">
							<div class="text-xs font-black text-primary uppercase tracking-widest mb-1">Etappe 3</div>
							<div class="font-bold text-xl">Marseille – Hyères</div>
							<p class="text-sm text-gray-500">Regionalzug TER, ca. 1h</p>
						</div>
					</div>
				</div>
				<div
					class="bg-neutral-900 dark:bg-black p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
					<div class="flex items-center gap-4">
						<div class="p-3 bg-white/10 rounded-xl">
							<UIcon name="i-lucide-info" class="w-8 h-8 text-white" />
						</div>
						<div>
							<span class="font-bold block text-lg">Transfer ab Hyères</span>
							<span class="text-white/80">Bus Linie 67 (20 Min) oder Taxi (10 Min) nach Giens.</span>
						</div>
					</div>
					<UButton
						to="https://www.sbb.ch"
						target="_blank"
						color="neutral"
						variant="solid"
						size="xl"
						class="rounded-full px-8 bg-white text-neutral-900 hover:bg-gray-100 border-none"
						icon="i-lucide-external-link"
						>Fahrplan SBB</UButton
					>
				</div>
			</div>
		</section>

		<!-- Details: Flugzeug -->
		<section id="mit-dem-flugzeug" class="max-w-screen-lg mx-auto px-4 scroll-mt-32">
			<UiTitle subtitle="Am schnellsten ans Ziel" title="Mit dem Flugzeug" />
			<div class="grid md:grid-cols-2 gap-12 mt-12 items-center">
				<div class="prose dark:prose-invert max-w-none text-lg">
					<p>
						Der Flughafen <strong>Toulon-Hyères (TLN)</strong> liegt nur 15 Minuten von Giens entfernt und ist ideal für
						Kurztrips.
					</p>
					<p>
						Alternativ bietet sich der Flughafen <strong>Marseille (MRS)</strong> an, der von Zürich oder Genf oft
						mehrmals täglich direkt angeflogen wird. Die Weiterreise nach Giens dauert von dort etwa 1h 15min mit dem
						Auto.
					</p>
				</div>
				<div class="grid grid-cols-1 gap-4">
					<div
						class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
						<div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-primary">
							<UIcon name="i-lucide-plane-takeoff" class="w-10 h-10" />
						</div>
						<div>
							<div class="text-lg font-bold">Direktflüge</div>
							<div class="text-gray-500">Ab Genf / Zürich nach Marseille oder Toulon.</div>
						</div>
					</div>
					<div
						class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
						<div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-secondary">
							<UIcon name="i-lucide-car-front" class="w-10 h-10" />
						</div>
						<div>
							<div class="text-lg font-bold">Mietwagen</div>
							<div class="text-gray-500">Direkt an allen Flughäfen verfügbar.</div>
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
