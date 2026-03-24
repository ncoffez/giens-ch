<script lang="ts" setup>
const { t } = useI18n();

const defaultFreizeit = `<p>Die Halbinsel von Giens bietet ein breites Angebot an Freizeitaktivitäten für jeden Geschmack.</p>`;
const defaultMaerkte = `<p>In der Region gibt es jeden Tag der Woche einen Markt – frische Produkte direkt vom Erzeuger.</p>`;
const defaultEinkauf = `<p>Für den täglichen Bedarf finden Sie in der Umgebung alles Wichtige.</p>`;
const defaultAusfluege = `<p>Von Giens aus erreichen Sie bequem traumhafte Ausflugsziele.</p>`;

const freizeitContent = await usePageContent("travel-freizeit");
const maerkteContent = await usePageContent("travel-maerkte");
const einkaufContent = await usePageContent("travel-einkauf");
const ausfluegeContent = await usePageContent("travel-ausfluege");
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			:title="t('hero.entdecken.title')"
			:subtitle="t('hero.entdecken.subtitle')"
			src="/giens/giens-aerial.webp"
			alt="Luftaufnahme von Giens und der Halbinsel"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

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
			<ClientOnly v-if="freizeitContent.isEditing.value && freizeitContent.status.value !== 'pending'">
				<TiptapLazyEditor v-model="freizeitContent.content.value" />
			</ClientOnly>
			<div v-else-if="freizeitContent.status.value !== 'pending'">
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
		</section>

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
			<ClientOnly v-if="maerkteContent.isEditing.value && maerkteContent.status.value !== 'pending'">
				<TiptapLazyEditor v-model="maerkteContent.content.value" />
			</ClientOnly>
			<div v-else-if="maerkteContent.status.value !== 'pending'">
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
		</section>

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
			<ClientOnly v-if="einkaufContent.isEditing.value && einkaufContent.status.value !== 'pending'">
				<TiptapLazyEditor v-model="einkaufContent.content.value" />
			</ClientOnly>
			<div v-else-if="einkaufContent.status.value !== 'pending'">
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
		</section>

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
			<ClientOnly v-if="ausfluegeContent.isEditing.value && ausfluegeContent.status.value !== 'pending'">
				<TiptapLazyEditor v-model="ausfluegeContent.content.value" />
			</ClientOnly>
			<div v-else-if="ausfluegeContent.status.value !== 'pending'">
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
		</section>
	</div>
</template>

<style scoped>
.scroll-mt-32 {
	scroll-margin-top: 8rem;
}
</style>
