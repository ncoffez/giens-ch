<script lang="ts" setup>
import type { FeatureCard, LinkItem, MarketItem } from "../../types";

const { t } = useI18n();

const defaultFreizeit = `<p>Die Halbinsel von Giens bietet ein breites Angebot an Freizeitaktivitäten für jeden Geschmack.</p>`;
const defaultMaerkte = `<p>In der Region gibt es jeden Tag der Woche einen Markt – frische Produkte direkt vom Erzeuger.</p>`;
const defaultEinkauf = `<p>Für den täglichen Bedarf finden Sie in der Umgebung alles Wichtige.</p>`;
const defaultAusfluege = `<p>Von Giens aus erreichen Sie bequem traumhafte Ausflugsziele.</p>`;

const publicPageBundle = await usePublicPageBundle("entdecken");
const freizeitContent = publicPageBundle.createContentSection("travel-freizeit", defaultFreizeit);
const maerkteContent = publicPageBundle.createContentSection("travel-maerkte", defaultMaerkte);
const einkaufContent = publicPageBundle.createContentSection("travel-einkauf", defaultEinkauf);
const ausfluegeContent = publicPageBundle.createContentSection("travel-ausfluege", defaultAusfluege);

const defaultFreizeitCards: FeatureCard[] = [
	{
		icon: "i-lucide-sailboat",
		title: t("travel.freizeit.wassersport.title"),
		description: t("travel.freizeit.wassersport.description"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-footprints",
		title: t("travel.freizeit.wandern.title"),
		description: t("travel.freizeit.wandern.description"),
		bgColor: "emerald",
		iconColor: "emerald",
	},
	{
		icon: "i-lucide-waves",
		title: t("travel.freizeit.tauchen.title"),
		description: t("travel.freizeit.tauchen.description"),
		bgColor: "cyan",
		iconColor: "cyan",
	},
];

const defaultMarketItems: MarketItem[] = [
	{ dayKey: "tue", label: "Giens", description: "Bio-Produkte, Blumen, regionale Spezialitäten und typische Erzeugerware aus der Provence." },
	{ dayKey: "wed", label: "L'Ayguade", description: "Obst, Gemüse, Käse, Fisch, Meeresfrüchte sowie Fleisch- und Wurstwaren." },
	{ dayKey: "thu", label: "Carqueiranne", description: "Obst, Gemüse, Fisch, regionale Produkte, Blumen sowie etwas Mode und Accessoires." },
	{ dayKey: "fri", label: "La Capte", description: "Obst, Gemüse, Käse, Fisch, Meeresfrüchte, Blumen und etwas Textilware." },
	{ dayKey: "sat", label: "Hyères", description: "Produzentenware, Obst, Gemüse, Käse, Bio-Produkte, Fisch und Blumen." },
	{ dayKey: "sun", label: "Hyères-Port", description: "Obst, Gemüse, Käse, Fisch, Meeresfrüchte und regionale Spezialitäten am Hafen." },
	{ dayKey: "sun", label: "La Londe", description: "Obst, Gemüse, Käse, Bio- und Regionalprodukte, Fisch und Blumen." },
	{ dayKey: "sun", label: "Flohmarkt (Marché aux Puces) in La Capte", description: "Trödel, Vintage-Stücke, Deko, Haushaltswaren und wechselnde Fundstücke." },
];

const defaultShoppingCards: FeatureCard[] = [
	{
		icon: "i-lucide-map-pin",
		title: t("travel.einkauf.giens.title"),
		description: t("travel.einkauf.giens.description"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-croissant",
		title: t("travel.einkauf.bakery.title"),
		description: t("travel.einkauf.bakery.description"),
		bgColor: "amber",
		iconColor: "amber",
	},
	{
		icon: "i-lucide-shopping-cart",
		title: t("travel.einkauf.hyeres.title"),
		description: t("travel.einkauf.hyeres.description"),
		bgColor: "emerald",
		iconColor: "emerald",
	},
];

const defaultLaundryCard: FeatureCard[] = [
	{
		icon: "i-lucide-washing-machine",
		title: t("travel.einkauf.laundry.title"),
		description: t("travel.einkauf.laundry.description"),
		bgColor: "cyan",
		iconColor: "cyan",
	},
];

const defaultExcursionCards: FeatureCard[] = [
	{
		icon: "i-lucide-map",
		title: t("travel.ausfluege.porquerolles.title"),
		description: t("travel.ausfluege.porquerolles.description"),
		bgColor: "blue",
		iconColor: "blue",
	},
	{
		icon: "i-lucide-trees",
		title: t("travel.ausfluege.portCros.title"),
		description: t("travel.ausfluege.portCros.description"),
		bgColor: "emerald",
		iconColor: "emerald",
	},
	{
		icon: "i-lucide-sun",
		title: t("travel.ausfluege.levant.title"),
		description: t("travel.ausfluege.levant.description"),
		bgColor: "amber",
		iconColor: "amber",
	},
];

const freizeitCards = publicPageBundle.createDataSection<FeatureCard[]>("travel-freizeit-cards", defaultFreizeitCards);
const marketItems = publicPageBundle.createDataSection<MarketItem[]>("travel-market-items", defaultMarketItems);
const shoppingCards = publicPageBundle.createDataSection<FeatureCard[]>("travel-shopping-cards", defaultShoppingCards);
const laundryCard = publicPageBundle.createDataSection<FeatureCard[]>("travel-laundry-card", defaultLaundryCard);
const excursionCards = publicPageBundle.createDataSection<FeatureCard[]>("travel-excursion-cards", defaultExcursionCards);
const defaultLinks: LinkItem[] = [];
const links = publicPageBundle.createDataSection<LinkItem[]>("travel-links", defaultLinks);
const hoveredMarketKey = ref<string | null>(null);
const expandedMarketKey = ref<string | null>(null);
const marketDescriptionMaxLength = 160;

function getColorClasses(color: string) {
	const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
		blue: {
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-600 dark:text-blue-400",
			border: "border-blue-100 dark:border-blue-900",
			gradient: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-100 dark:border-blue-900",
		},
		amber: {
			bg: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-600 dark:text-amber-400",
			border: "border-amber-100 dark:border-amber-900",
			gradient: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-100 dark:border-amber-900",
		},
		rose: {
			bg: "bg-rose-100 dark:bg-rose-900/30",
			text: "text-rose-600 dark:text-rose-400",
			border: "border-rose-100 dark:border-rose-900",
			gradient: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 border-rose-100 dark:border-rose-900",
		},
		emerald: {
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			text: "text-emerald-600 dark:text-emerald-400",
			border: "border-emerald-100 dark:border-emerald-900",
			gradient: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-100 dark:border-green-900",
		},
		purple: {
			bg: "bg-purple-100 dark:bg-purple-900/30",
			text: "text-purple-600 dark:text-purple-400",
			border: "border-purple-100 dark:border-purple-900",
			gradient: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-100 dark:border-purple-900",
		},
		cyan: {
			bg: "bg-cyan-100 dark:bg-cyan-900/30",
			text: "text-cyan-600 dark:text-cyan-400",
			border: "border-cyan-100 dark:border-cyan-900",
			gradient: "bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50 border-cyan-100 dark:border-cyan-900",
		},
	};

	return colors[color] || colors.blue;
}

function marketCardKey(market: MarketItem) {
	return `${market.dayKey}-${market.label}`;
}

function toggleMarketDescription(market: MarketItem) {
	const key = marketCardKey(market);
	expandedMarketKey.value = expandedMarketKey.value === key ? null : key;
}

const activeMarket = computed(() => {
	const allMarkets = marketItems.data.value || [];

	if (!allMarkets.length) {
		return null;
	}

	const activeKey = hoveredMarketKey.value || expandedMarketKey.value;

	if (!activeKey) {
		return allMarkets[0];
	}

	return allMarkets.find((market) => marketCardKey(market) === activeKey) || allMarkets[0];
});

function isMarketActive(market: MarketItem) {
	return activeMarket.value ? marketCardKey(activeMarket.value) === marketCardKey(market) : false;
}

function getMarketDescription(market: MarketItem | null) {
	if (!market?.description) {
		return "";
	}

	return market.description.length > marketDescriptionMaxLength
		? `${market.description.slice(0, marketDescriptionMaxLength).trim()}…`
		: market.description;
}
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			:title="t('hero.entdecken.title')"
			:subtitle="t('hero.entdecken.subtitle')"
			src="/giens/porquerolle.webp"
			alt="Türkisfarbenes Wasser und Küste bei Porquerolles"
			height="h-[40vh] md:h-[54vh] min-h-[300px] md:min-h-[420px]"
			image-class="object-[center_62%]"
			content-class="max-w-3xl"
			subtitle-class="md:text-xl"
			overlay-class="bg-[linear-gradient(180deg,rgba(6,16,22,0.12)_0%,rgba(6,16,22,0.2)_34%,rgba(6,16,22,0.72)_100%)] dark:bg-[linear-gradient(180deg,rgba(5,8,10,0.16)_0%,rgba(5,8,10,0.3)_34%,rgba(5,8,10,0.84)_100%)]" />

		<section id="freizeit" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.freizeit.subtitle')" :title="t('travel.freizeit.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="freizeitContent.canEdit.value && !freizeitContent.isEditing.value">
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
				<div class="flex items-center justify-end gap-2">
					<template v-if="freizeitCards.canEdit.value && !freizeitCards.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="freizeitCards.startEditing()">
							Karten bearbeiten
						</UButton>
					</template>
					<template v-else-if="freizeitCards.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="freizeitCards.isSaving.value" @click="freizeitCards.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="freizeitCards.isSaving.value" @click="freizeitCards.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</div>
				<div class="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3">
					<div
						v-for="card in freizeitCards.data.value"
						:key="card.title"
						class="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800"
					>
						<div :class="[getColorClasses(card.bgColor).bg, getColorClasses(card.iconColor).text, 'w-fit rounded-xl p-3 mb-4']">
							<UIcon :name="card.icon" class="w-6 h-6" />
						</div>
						<h3 class="font-bold text-lg mb-2">{{ card.title }}</h3>
						<p class="text-stone-500 text-sm">
							{{ card.description }}
						</p>
					</div>
				</div>
				<ClientOnly v-if="freizeitCards.isEditing.value">
					<div class="mt-8">
						<UiLazyFeatureCardsEditor v-model="freizeitCards.data.value" />
					</div>
				</ClientOnly>
			</div>
		</section>

		<section id="maerkte" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.maerkte.subtitle')" :title="t('travel.maerkte.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="maerkteContent.canEdit.value && !maerkteContent.isEditing.value">
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
				<div class="flex items-center justify-end gap-2">
					<template v-if="marketItems.canEdit.value && !marketItems.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="marketItems.startEditing()">
							Märkte bearbeiten
						</UButton>
					</template>
					<template v-else-if="marketItems.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="marketItems.isSaving.value" @click="marketItems.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="marketItems.isSaving.value" @click="marketItems.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</div>
				<ClientOnly v-if="marketItems.isEditing.value">
					<UiLazyMarketItemsEditor v-model="marketItems.data.value" />
				</ClientOnly>
				<div v-else>
					<div class="mt-8 flex flex-wrap gap-3">
						<button
							v-for="market in marketItems.data.value"
							:key="marketCardKey(market)"
							type="button"
							class="w-[9.75rem] rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-left transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-primary/10"
							:class="isMarketActive(market) ? 'border-primary/50 bg-primary/5 text-primary dark:bg-primary/10' : 'text-stone-700 dark:text-stone-200'"
							@mouseenter="hoveredMarketKey = marketCardKey(market)"
							@mouseleave="hoveredMarketKey = null"
							@click="toggleMarketDescription(market)"
						>
							<div class="text-[11px] font-bold uppercase tracking-wider text-primary">
								{{ t(`travel.maerkte.days.${market.dayKey}`) }}
							</div>
							<div class="mt-1 font-semibold">
								{{ market.label }}
							</div>
						</button>
					</div>

					<div v-if="activeMarket" class="mt-5 max-w-3xl min-h-[5.5rem]">
						<div class="mb-1 text-sm font-medium text-stone-700 dark:text-stone-300">
							{{ activeMarket.label }}
						</div>
						<p class="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
							{{ getMarketDescription(activeMarket) }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<section id="einkauf" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.einkauf.subtitle')" :title="t('travel.einkauf.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="einkaufContent.canEdit.value && !einkaufContent.isEditing.value">
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
				<div class="flex items-center justify-end gap-2">
					<template v-if="shoppingCards.canEdit.value && !shoppingCards.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="shoppingCards.startEditing()">
							Einträge bearbeiten
						</UButton>
					</template>
					<template v-else-if="shoppingCards.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="shoppingCards.isSaving.value" @click="shoppingCards.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="shoppingCards.isSaving.value" @click="shoppingCards.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
					<template v-if="laundryCard.canEdit.value && !laundryCard.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="laundryCard.startEditing()">
							Wäscherei bearbeiten
						</UButton>
					</template>
					<template v-else-if="laundryCard.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="laundryCard.isSaving.value" @click="laundryCard.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="laundryCard.isSaving.value" @click="laundryCard.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</div>
				<div class="grid md:grid-cols-2 gap-8 mt-8">
					<div class="space-y-4">
						<div
							v-for="card in shoppingCards.data.value"
							:key="card.title"
							class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 flex items-start gap-4"
						>
							<UIcon :name="card.icon" :class="[getColorClasses(card.iconColor).text, 'w-5 h-5 mt-0.5']" />
							<div>
								<h4 class="font-bold">{{ card.title }}</h4>
								<p class="text-stone-500 text-sm">{{ card.description }}</p>
							</div>
						</div>
					</div>
					<div>
						<div
							v-if="laundryCard.data.value[0]"
							class="p-6 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20"
						>
							<div class="flex items-center gap-3 mb-4">
								<UIcon :name="laundryCard.data.value[0].icon" class="w-6 h-6 text-primary" />
								<h4 class="font-bold text-lg">{{ laundryCard.data.value[0].title }}</h4>
							</div>
							<p class="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
								{{ laundryCard.data.value[0].description }}
							</p>
						</div>
					</div>
				</div>
				<ClientOnly v-if="shoppingCards.isEditing.value || laundryCard.isEditing.value">
					<div class="mt-8 space-y-8">
						<div v-if="shoppingCards.isEditing.value" class="space-y-3">
							<p class="text-sm font-semibold text-stone-900 dark:text-white">
								Einkaufseinträge bearbeiten
							</p>
							<UiLazyFeatureCardsEditor v-model="shoppingCards.data.value" />
						</div>
						<div v-if="laundryCard.isEditing.value" class="space-y-3">
							<p class="text-sm font-semibold text-stone-900 dark:text-white">
								Wäscherei bearbeiten
							</p>
							<UiLazyFeatureCardsEditor v-model="laundryCard.data.value" />
						</div>
					</div>
				</ClientOnly>
			</div>
		</section>

		<section id="ausfluege" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.ausfluege.subtitle')" :title="t('travel.ausfluege.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="ausfluegeContent.canEdit.value && !ausfluegeContent.isEditing.value">
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
				<div class="flex items-center justify-end gap-2">
					<template v-if="excursionCards.canEdit.value && !excursionCards.isEditing.value">
						<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="excursionCards.startEditing()">
							Karten bearbeiten
						</UButton>
					</template>
					<template v-else-if="excursionCards.isEditing.value">
						<UButton color="neutral" variant="ghost" size="sm" :disabled="excursionCards.isSaving.value" @click="excursionCards.cancelEditing()">
							{{ t("editor.cancel") }}
						</UButton>
						<UButton color="primary" icon="i-lucide-save" size="sm" :loading="excursionCards.isSaving.value" @click="excursionCards.save()">
							{{ t("editor.save") }}
						</UButton>
					</template>
				</div>
				<div class="grid gap-6 mt-8 md:grid-cols-3">
					<div
						v-for="card in excursionCards.data.value"
						:key="card.title"
						:class="[getColorClasses(card.bgColor).gradient, 'p-6 rounded-2xl border']"
					>
						<UIcon :name="card.icon" :class="[getColorClasses(card.iconColor).text, 'w-8 h-8 mb-4']" />
						<h3 class="font-bold text-lg mb-2">{{ card.title }}</h3>
						<p class="text-stone-500 text-sm">
							{{ card.description }}
						</p>
					</div>
				</div>
				<ClientOnly v-if="excursionCards.isEditing.value">
					<div class="mt-8">
						<UiLazyFeatureCardsEditor v-model="excursionCards.data.value" />
					</div>
				</ClientOnly>
			</div>
		</section>

		<section id="links" class="max-w-screen-xl mx-auto px-4 scroll-mt-32">
			<UiTitle :subtitle="t('travel.links.subtitle')" :title="t('travel.links.title')" />

			<div class="flex items-center justify-end gap-2 mt-4">
				<template v-if="links.canEdit.value && !links.isEditing.value">
					<UButton color="neutral" variant="outline" icon="i-lucide-edit" size="sm" @click="links.startEditing()">
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="links.isEditing.value">
					<UButton color="neutral" variant="ghost" size="sm" :disabled="links.isSaving.value" @click="links.cancelEditing()">
						{{ t("editor.cancel") }}
					</UButton>
					<UButton color="primary" icon="i-lucide-save" size="sm" :loading="links.isSaving.value" @click="links.save()">
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="links.status.value === 'pending'" class="flex justify-center py-8">
				<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
			<template v-else>
				<div v-if="links.data.value.length" class="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2">
					<a
						v-for="link in links.data.value"
						:key="link.url"
						:href="link.url"
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-start justify-between gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10"
					>
						<div>
							<h3 class="font-bold text-base mb-1 text-stone-900 dark:text-white">
								{{ link.title }}
							</h3>
							<p class="text-stone-500 text-sm">
								{{ link.description }}
							</p>
						</div>
						<UIcon
							name="i-lucide-arrow-up-right"
							class="w-5 h-5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
						/>
					</a>
				</div>
				<ClientOnly v-if="links.isEditing.value">
					<div class="mt-8">
						<UiLazyLinksEditor v-model="links.data.value" />
					</div>
				</ClientOnly>
			</template>
		</section>
	</div>
</template>

<style scoped>
.scroll-mt-32 {
	scroll-margin-top: 8rem;
}
</style>
