<script setup lang="ts">
const { $token, $currentUser, $isAdmin } = useNuxtApp();
const route = useRoute();
const toast = useToast();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activePhoto = ref(0);

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;
		home.value = await $fetch(`/api/homes/${homeId.value}`, {
			headers: { Authorization: `Bearer ${$token.value}` },
		});
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
};

const canEdit = computed(() => {
	if (!$currentUser.value || !home.value) return false;
	return home.value?.ownerIds?.includes($currentUser.value.uid) || home.value?.editors?.includes($currentUser.value.uid) || $isAdmin.value;
});

const hasContent = computed(() => {
	if (!home.value) return false;
	return !!(
		home.value.checkInInfo ||
		home.value.checkOutInfo ||
		home.value.houseRules ||
		home.value.mustKnows?.length ||
		home.value.cleaningInfo?.length ||
		home.value.blanketsInfo ||
		home.value.washingMachineOverride
	);
});

onMounted(fetchHome);
watch(homeId, fetchHome);
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
			<div class="text-center space-y-4">
				<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p class="text-stone-500 font-medium">Laden...</p>
			</div>
		</div>

		<div v-else-if="error" class="max-w-screen-lg mx-auto px-4 py-20">
			<div class="text-center space-y-6">
				<div class="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
					<UIcon name="i-lucide-alert-circle" class="w-10 h-10 text-red-500" />
				</div>
				<h1 class="text-2xl font-bold text-red-600">{{ error }}</h1>
				<UButton color="neutral" variant="soft" @click="fetchHome">Erneut versuchen</UButton>
			</div>
		</div>

		<div v-else-if="!home" class="max-w-screen-lg mx-auto px-4 py-20">
			<div class="text-center space-y-6">
				<div class="w-20 h-20 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
					<UIcon name="i-lucide-home" class="w-10 h-10 text-stone-400" />
				</div>
				<h1 class="text-2xl font-bold">Haus nicht gefunden</h1>
			</div>
		</div>

		<template v-else>
			<div class="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
				<nav class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<UButton
							color="neutral"
							variant="ghost"
							icon="i-lucide-arrow-left"
							@click="navigateTo('/homes')"
						/>
						<div>
							<h1 class="text-2xl font-black">{{ home.name }}</h1>
							<p class="text-sm text-stone-500">
								Erstellt: {{ new Date(home.createdAt).toLocaleDateString('de-CH') }}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<UButton
							v-if="canEdit"
							:to="`/homes/${home.id}/edit`"
							color="primary"
							icon="i-lucide-edit-3"
						>
							Bearbeiten
						</UButton>
					</div>
				</nav>

				<div class="grid lg:grid-cols-3 gap-8">
					<div class="lg:col-span-2 space-y-8">
						<section v-if="home.photos?.length" class="relative rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-xl">
							<div class="aspect-video relative">
								<img
									:src="home.photos[activePhoto]"
									:alt="`${home.name} - Foto ${activePhoto + 1}`"
									class="w-full h-full object-cover"
								/>
								<div v-if="home.photos.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
									<button
										v-for="(_, index) in home.photos"
										:key="index"
										@click="activePhoto = index"
										class="w-2 h-2 rounded-full transition-all"
										:class="index === activePhoto ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'"
									/>
								</div>
							</div>
							<div v-if="home.photos.length > 1" class="flex gap-2 p-4 overflow-x-auto">
								<button
									v-for="(photo, index) in home.photos"
									:key="index"
									@click="activePhoto = index"
									class="shrink-0 w-20 h-20 rounded-xl overflow-hidden ring-2 transition-all"
									:class="index === activePhoto ? 'ring-primary' : 'ring-transparent hover:ring-gray-300'"
								>
									<img :src="photo" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" />
								</button>
							</div>
						</section>

						<section v-else class="aspect-video rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
							<div class="text-center space-y-4 text-stone-400">
								<UIcon name="i-lucide-image" class="w-16 h-16 mx-auto" />
								<p class="font-medium">Keine Fotos vorhanden</p>
							</div>
						</section>

						<div v-if="hasContent" class="space-y-6">
							<section v-if="home.checkInInfo" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
										<UIcon name="i-lucide-log-in" class="w-5 h-5 text-green-600" />
									</div>
									<h2 class="text-lg font-bold">Anreise</h2>
								</div>
								<div class="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300" v-html="home.checkInInfo" />
							</section>

							<section v-if="home.checkOutInfo" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
										<UIcon name="i-lucide-log-out" class="w-5 h-5 text-orange-600" />
									</div>
									<h2 class="text-lg font-bold">Abreise</h2>
								</div>
								<div class="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300" v-html="home.checkOutInfo" />
							</section>

							<section v-if="home.houseRules" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
										<UIcon name="i-lucide-book-open" class="w-5 h-5 text-blue-600" />
									</div>
									<h2 class="text-lg font-bold">Hausregeln</h2>
								</div>
								<div class="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300" v-html="home.houseRules" />
							</section>

							<section v-if="home.mustKnows?.length" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
										<UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-600" />
									</div>
									<h2 class="text-lg font-bold">Wichtig zu wissen</h2>
								</div>
								<ul class="space-y-2">
									<li v-for="(item, index) in home.mustKnows" :key="index" class="flex items-start gap-3">
										<UIcon name="i-lucide-check-circle" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
										<span class="text-stone-600 dark:text-stone-300">{{ item }}</span>
									</li>
								</ul>
							</section>

							<section v-if="home.cleaningInfo?.length" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
										<UIcon name="i-lucide-sparkles" class="w-5 h-5 text-purple-600" />
									</div>
									<h2 class="text-lg font-bold">Reinigung</h2>
								</div>
								<ul class="space-y-2">
									<li v-for="(item, index) in home.cleaningInfo" :key="index" class="flex items-start gap-3">
										<UIcon name="i-lucide-check-circle" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
										<span class="text-stone-600 dark:text-stone-300">{{ item }}</span>
									</li>
								</ul>
							</section>

							<section v-if="home.blanketsInfo" class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
										<UIcon name="i-lucide-bed" class="w-5 h-5 text-indigo-600" />
									</div>
									<h2 class="text-lg font-bold">Bettwäsche & Decken</h2>
								</div>
								<div class="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300" v-html="home.blanketsInfo" />
							</section>

							<section class="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm">
								<div class="flex items-center gap-3 mb-4">
									<div class="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
										<UIcon name="i-lucide-washing-machine" class="w-5 h-5 text-cyan-600" />
									</div>
									<h2 class="text-lg font-bold">Waschmaschine</h2>
								</div>
								<div v-if="home.washingMachineOverride" class="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300" v-html="home.washingMachineOverride" />
								<p v-else class="text-stone-500 italic">Bitte kontaktieren Sie den Eigentümer für Informationen zur Waschmaschine.</p>
							</section>
						</div>

						<div v-else class="text-center py-16 bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
							<UIcon name="i-lucide-file-text" class="w-12 h-12 mx-auto text-stone-300 mb-4" />
							<p class="text-stone-500">Keine Informationen vorhanden</p>
							<UButton v-if="canEdit" :to="`/homes/${home.id}/edit`" color="primary" class="mt-4">
								Informationen hinzufügen
							</UButton>
						</div>
					</div>

					<aside class="space-y-6">
						<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm overflow-hidden sticky top-24">
							<div class="p-6 space-y-6">
								<div v-if="home.wifiPassword" class="flex items-center gap-4">
									<div class="p-3 rounded-xl bg-stone-100 dark:bg-gray-700">
										<UIcon name="i-lucide-wifi" class="w-6 h-6 text-stone-600 dark:text-stone-300" />
									</div>
									<div>
										<p class="text-xs text-stone-500 uppercase tracking-wide font-bold">WLAN</p>
										<p class="font-mono font-bold text-lg">{{ home.wifiPassword }}</p>
									</div>
								</div>

								<div v-if="home.parkingNumber" class="flex items-center gap-4">
									<div class="p-3 rounded-xl bg-stone-100 dark:bg-gray-700">
										<UIcon name="i-lucide-car" class="w-6 h-6 text-stone-600 dark:text-stone-300" />
									</div>
									<div>
										<p class="text-xs text-stone-500 uppercase tracking-wide font-bold">Parkplatz</p>
										<p class="font-bold text-lg">Nr. {{ home.parkingNumber }}</p>
									</div>
								</div>
							</div>

							<div v-if="home.contact?.name || home.contact?.phone || home.contact?.email" class="border-t border-stone-100 dark:border-stone-700 p-6 space-y-4">
								<h3 class="text-xs text-stone-500 uppercase tracking-wide font-bold">Kontakt</h3>
								<div class="space-y-3">
									<div v-if="home.contact.name" class="flex items-center gap-3">
										<UIcon name="i-lucide-user" class="w-4 h-4 text-stone-400" />
										<span>{{ home.contact.name }}</span>
									</div>
									<a v-if="home.contact.phone" :href="`tel:${home.contact.phone}`" class="flex items-center gap-3 hover:text-primary transition-colors">
										<UIcon name="i-lucide-phone" class="w-4 h-4 text-stone-400" />
										<span>{{ home.contact.phone }}</span>
									</a>
									<a v-if="home.contact.email" :href="`mailto:${home.contact.email}`" class="flex items-center gap-3 hover:text-primary transition-colors">
										<UIcon name="i-lucide-mail" class="w-4 h-4 text-stone-400" />
										<span>{{ home.contact.email }}</span>
									</a>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</template>
	</div>
</template>