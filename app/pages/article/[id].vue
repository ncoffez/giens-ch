<template>
	<div v-if="error" class="max-w-screen-xl mx-auto px-4 py-20">
		<p class="text-error">Error loading article: {{ error?.data?.message ?? error?.message ?? "Unknown error" }}</p>
	</div>
	<div v-else-if="status === 'pending'">
		<UiArticleSkeleton />
	</div>
	<div v-else-if="article" class="w-full space-y-12 mb-24">
		<!-- Subtle Banner -->
		<section class="relative w-full h-64 md:h-96 overflow-hidden rounded-[2.5rem] shadow-xl bg-gray-100 dark:bg-gray-800">
			<img
				v-if="article.image"
				:src="article.image"
				class="object-cover h-full w-full brightness-105 contrast-[95%] scale-105"
				:alt="article.title"
				loading="eager" />
			<div v-else class="w-full h-full flex items-center justify-center">
				<UIcon name="i-lucide-image" class="w-20 h-20 text-neutral-300" />
			</div>
		</section>

		<div class="max-w-screen-lg mx-auto px-4 w-full">
			<!-- Header -->
			<div class="mb-12">
				<UiTitle
					:subtitle="new Date(article.published).toLocaleDateString('de-CH')"
					:title="article.title" />
				
				<!-- Author Info -->
				<div v-if="article.author" class="flex items-center gap-3 mb-8 -mt-4">
					<NuxtLink 
						v-if="article.authorUid" 
						:to="`/profile/${article.authorUid}`"
						class="flex items-center gap-2 group"
					>
						<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
							{{ article.author.charAt(0) }}
						</div>
						<span class="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
							{{ article.author }}
						</span>
					</NuxtLink>
					<div v-else class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
							{{ article.author.charAt(0) }}
						</div>
						<span class="text-sm font-bold text-gray-600 dark:text-gray-400">
							{{ article.author }}
						</span>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<UBadge
						v-for="tag in article.tags"
						:key="tag"
						color="primary"
						variant="subtle"
						class="rounded-full px-3 py-1">
						{{ tag }}
					</UBadge>
				</div>
			</div>

			<!-- Content -->
			<article class="prose max-w-none mx-auto lg:text-lg leading-relaxed">
				<!-- Show body if accessible -->
				<div v-if="canReadBody && article && article.body">
					<div v-html="article.body"></div>
				</div>
				
				<!-- Login prompt for private articles -->
				<div v-else class="text-center py-12 space-y-6">
					<UIcon name="i-lucide-lock" class="w-16 h-16 text-gray-300 mx-auto" />
					<div class="space-y-4">
						<h2 class="text-2xl font-bold">Bitte anmelden</h2>
						<p class="text-gray-600">Dieser Artikel ist nur für authentifizierte Mitglieder sichtbar.</p>
						<div class="flex gap-4 justify-center">
							<NuxtLink to="/login">
								<UButton size="xl" color="primary">Anmelden</UButton>
							</NuxtLink>
							<NuxtLink to="/register">
								<UButton size="xl" variant="outline">Registrieren</UButton>
							</NuxtLink>
						</div>
					</div>
				</div>
			</article>
		</div>
	</div>
</template>
<script lang="ts" setup>
import type { Article } from "~/types";

const route = useRoute();
const id = route.params.id;
const nuxtApp = useNuxtApp() as any;
const token = computed(() => import.meta.client ? nuxtApp.$token?.value : null);
const isAuthenticated = computed(() => token.value !== null);

const {
	data: articleData,
	error,
	status,
} = await useLazyFetch(`/api/getArticle`, {
	method: "post",
	body: { id },
	headers: computed(() => {
		return token.value ? { Authorization: `Bearer ${token.value}` } : {};
	}),
});

const article = computed(() => articleData.value);
const isPrivateArticle = computed(() => article.value?.isPrivate || false);

const canReadBody = computed(() => {
	return !!article.value?.body;
});
</script>
<style scoped></style>
