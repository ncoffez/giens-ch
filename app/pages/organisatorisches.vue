<script setup lang="ts">
const { t } = useI18n();

definePageMeta({
	middleware: ["is-logged-in"],
});

const organisatorischesContent = await usePageContent("organisatorisches");
const { handleHashScroll } = useHashScroll();
const contentRef = ref<HTMLElement | null>(null);

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/é/g, "e")
		.replace(/è/g, "e")
		.replace(/ê/g, "e")
		.replace(/à/g, "a")
		.replace(/ù/g, "u")
		.replace(/ç/g, "c")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function addHeadingIds() {
	if (!contentRef.value) return;

	const headings = contentRef.value.querySelectorAll("h1, h2, h3, h4");
	headings.forEach((heading) => {
		const text = heading.textContent || "";
		if (text && !heading.id) {
			heading.id = slugify(text);
		}
	});
}

watch([organisatorischesContent.content, organisatorischesContent.isEditing], () => {
	if (!organisatorischesContent.isEditing.value && organisatorischesContent.content.value) {
		nextTick(() => {
			addHeadingIds();
			handleHashScroll();
		});
	}
});

onMounted(() => {
	if (!organisatorischesContent.isEditing.value && organisatorischesContent.content.value) {
		nextTick(() => {
			addHeadingIds();
			handleHashScroll();
		});
	}
});

useHead({
	title: t("site.pageTitles.organisatorisches"),
});
</script>

<template>
	<div class="space-y-24 mb-20">
		<UiHero
			:title="t('hero.organisatorisches.title')"
			:subtitle="t('hero.organisatorisches.subtitle')"
			src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80"
			alt="Handschriftliche Notizen auf Papier"
			:responsive="false"
			height="h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px]" />

		<section class="max-w-screen-lg mx-auto px-4">
			<div class="flex items-center justify-end mb-8 gap-2">
				<template v-if="organisatorischesContent.isAdmin.value && !organisatorischesContent.isEditing.value">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-edit"
						@click="organisatorischesContent.startEditing()"
					>
						{{ t("editor.edit") }}
					</UButton>
				</template>
				<template v-else-if="organisatorischesContent.isEditing.value">
					<UButton
						color="neutral"
						variant="ghost"
						@click="organisatorischesContent.cancelEditing()"
						:disabled="organisatorischesContent.isSaving.value"
					>
						{{ t("editor.cancel") }}
					</UButton>
					<UButton
						color="primary"
						icon="i-lucide-save"
						:loading="organisatorischesContent.isSaving.value"
						@click="organisatorischesContent.save()"
					>
						{{ t("editor.save") }}
					</UButton>
				</template>
			</div>

			<div v-if="organisatorischesContent.status.value === 'pending'" class="flex justify-center py-12">
				<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>

			<template v-else>
				<ClientOnly v-if="organisatorischesContent.isEditing.value">
					<TiptapLazyEditor v-model="organisatorischesContent.content.value" />
				</ClientOnly>
				<div v-else>
					<div
						v-if="organisatorischesContent.content.value"
						ref="contentRef"
						class="prose dark:prose-invert max-w-none"
						v-html="organisatorischesContent.content.value"
					/>
					<div v-else class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
						<UIcon name="i-lucide-file-text" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
						<p class="text-stone-500">{{ t("editor.noContent") }}</p>
						<p v-if="organisatorischesContent.isAdmin.value" class="text-sm text-stone-400 mt-2">{{ t("editor.addContentHint") }}</p>
					</div>
				</div>
			</template>
		</section>
	</div>
</template>
