<script setup lang="ts">
import BasicInfoEditor from "~/components/homes/BasicInfoEditor.vue";
import PhotoGallery from "~/components/homes/PhotoGallery.vue";
import InstructionsEditor from "~/components/homes/InstructionsEditor.vue";
import RulesEditor from "~/components/homes/RulesEditor.vue";
import SharingPanel from "~/components/homes/SharingPanel.vue";

const { $token, $currentUser, $isAdmin } = useNuxtApp();
const route = useRoute();
const toast = useToast();

const homeId = computed(() => route.params.id as string);
const home = ref<any>(null);
const owners = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isReordering = ref(false);

// Section definitions
const allSections = {
	basic: { id: "basic", label: "Grundinformationen", component: BasicInfoEditor, icon: "i-lucide-home" },
	photos: { id: "photos", label: "Fotos", component: PhotoGallery, icon: "i-lucide-image" },
	instructions: { id: "instructions", label: "An-/Abreise", component: InstructionsEditor, icon: "i-lucide-key" },
	rules: { id: "rules", label: "Regeln & Info", component: RulesEditor, icon: "i-lucide-book-open" },
	sharing: { id: "sharing", label: "Freigabe", component: SharingPanel, icon: "i-lucide-share-2" },
};

const sectionOrder = ref<string[]>(["basic", "photos", "instructions", "rules", "sharing"]);

const orderedSections = computed(() => {
	return sectionOrder.value.map(id => allSections[id as keyof typeof allSections]).filter(Boolean);
});

const ownerMap = computed(() => {
	const map = new Map<string, any>();
	owners.value.forEach((o) => map.set(o.uid, o));
	return map;
});

const getOwners = (ownerIds: string[]) => {
	return (ownerIds || []).map((uid) => ownerMap.value.get(uid)).filter(Boolean);
};

const getOwnerInitials = (displayName: string) => {
	return displayName
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "??";
};

const fetchHome = async () => {
	try {
		loading.value = true;
		error.value = null;
		const [homeData, ownersData] = await Promise.all([
			$fetch(`/api/homes/${homeId.value}`, {
				headers: { Authorization: `Bearer ${$token.value}` },
			}),
			$fetch("/api/users/owners", {
				headers: { Authorization: `Bearer ${$token.value}` },
			})
		]);
		home.value = homeData;
		owners.value = ownersData as any[];
		
		if (home.value?.sectionOrder && Array.isArray(home.value.sectionOrder)) {
			// Ensure all existing sections are present, even if not in saved order
			const savedOrder = home.value.sectionOrder.filter((id: string) => id in allSections);
			const missingSections = Object.keys(allSections).filter(id => !savedOrder.includes(id));
			sectionOrder.value = [...savedOrder, ...missingSections];
		}
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Fehler beim Laden des Hauses";
	} finally {
		loading.value = false;
	}
};

const saveOrder = async () => {
	try {
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { sectionOrder: sectionOrder.value },
		});
		toast.add({ title: "Layout gespeichert", color: "success" });
		isReordering.value = false;
	} catch (e: any) {
		toast.add({ title: "Fehler beim Speichern des Layouts", color: "error" });
	}
};

const moveSection = (index: number, direction: 'up' | 'down') => {
	const newOrder = [...sectionOrder.value];
	const newIndex = direction === 'up' ? index - 1 : index + 1;
	if (newIndex >= 0 && newIndex < newOrder.length) {
		[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
		sectionOrder.value = newOrder;
	}
};

const deleteHome = async () => {
	if (!confirm("Sind Sie sicher, dass Sie dieses Haus löschen möchten?")) return;

	try {
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
		});

		toast.add({ title: "Haus erfolgreich gelöscht", color: "success" });
		navigateTo("/homes");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Löschen", color: "error" });
	}
};

const canDelete = computed(() => {
	return $isAdmin.value || ($currentUser.value && home.value?.ownerIds?.includes($currentUser.value.uid));
});

const scrollToSection = (id: string) => {
	const el = document.getElementById(`section-${id}`);
	if (el) {
		window.scrollTo({
			top: el.offsetTop - 100,
			behavior: 'smooth'
		});
	}
};

onMounted(fetchHome);
watch(homeId, fetchHome);
</script>

<template>
	<div class="min-h-screen bg-white dark:bg-gray-950">
		<!-- Simple Header -->
		<header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
			<div class="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<NuxtLink to="/homes" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
						<UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
					</NuxtLink>
					<div v-if="home" class="hidden sm:block">
						<h1 class="font-black text-lg">Haus {{ home.name }} bearbeiten</h1>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<UButton 
						v-if="home"
						:to="`/homes/view/${homeId}`" 
						variant="ghost" 
						color="neutral"
						icon="i-lucide-external-link"
						target="_blank"
					>
						Vorschau
					</UButton>
					<UButton 
						v-if="isReordering"
						color="primary" 
						@click="saveOrder"
						icon="i-lucide-check"
					>
						Layout speichern
					</UButton>
					<UButton 
						v-else
						variant="soft" 
						color="neutral"
						@click="isReordering = true"
						icon="i-lucide-layers"
					>
						Layout
					</UButton>
				</div>
			</div>
		</header>

		<div class="max-w-screen-xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
			<!-- Sidebar Nav (Desktop) -->
			<aside class="hidden lg:block w-64 shrink-0">
				<div class="sticky top-28 space-y-8">
					<div>
						<h2 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-3">Navigation</h2>
						<nav class="space-y-1">
							<button 
								v-for="section in orderedSections" 
								:key="section.id"
								@click="scrollToSection(section.id)"
								class="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all group"
							>
								<UIcon :name="section.icon" class="w-4 h-4 group-hover:scale-110 transition-transform" />
								{{ section.label }}
							</button>
						</nav>
					</div>

					<div v-if="home" class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
						<h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Eigentümer</h3>
						<div class="flex -space-x-2 mb-3">
							<UPopover
								v-for="owner in getOwners(home.ownerIds)"
								:key="owner.uid"
								mode="hover"
								:open-delay="200"
							>
								<UAvatar
									size="md"
									:src="owner.photoURL"
									:text="getOwnerInitials(owner.displayName)"
									class="ring-2 ring-white dark:ring-gray-900 shadow-sm cursor-pointer hover:z-10"
								/>
								<template #content>
									<UCard class="w-64">
										<UUser
											:name="owner.displayName"
											:description="owner.email"
											:avatar="{ src: owner.photoURL, text: getOwnerInitials(owner.displayName) }"
										/>
									</UCard>
								</template>
							</UPopover>
						</div>
						<p class="text-[10px] text-gray-400 leading-tight">Diese Personen können alle Details dieses Hauses bearbeiten.</p>
					</div>

					<UButton 
						v-if="canDelete" 
						color="error" 
						variant="ghost" 
						size="sm" 
						class="w-full justify-start px-3"
						@click="deleteHome"
						icon="i-lucide-trash-2"
					>
						Haus löschen
					</UButton>
				</div>
			</aside>

			<!-- Main Content -->
			<main class="flex-1 max-w-3xl">
				<div v-if="loading" class="space-y-12">
					<div v-for="i in 3" :key="i" class="space-y-4">
						<div class="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
						<div class="h-64 bg-gray-50 dark:bg-gray-900/50 rounded-3xl animate-pulse" />
					</div>
				</div>

				<div v-else-if="error" class="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
					<UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-red-500 mb-4" />
					<p class="text-red-600 font-bold">{{ error }}</p>
					<UButton color="neutral" variant="soft" class="mt-6" @click="fetchHome">Erneut versuchen</UButton>
				</div>

				<div v-else class="space-y-24 pb-32">
					<section 
						v-for="(section, index) in orderedSections" 
						:key="section.id" 
						:id="`section-${section.id}`"
						class="group relative"
					>
						<!-- Reordering Controls -->
						<div v-if="isReordering" class="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<UButton 
								variant="ghost" 
								color="neutral" 
								icon="i-lucide-chevron-up" 
								size="sm"
								:disabled="index === 0"
								@click="moveSection(index, 'up')"
							/>
							<UButton 
								variant="ghost" 
								color="neutral" 
								icon="i-lucide-chevron-down" 
								size="sm"
								:disabled="index === orderedSections.length - 1"
								@click="moveSection(index, 'down')"
							/>
						</div>

						<div class="space-y-6">
							<div class="flex items-center gap-4">
								<div class="p-3 bg-primary-50 dark:bg-primary-900/10 text-primary rounded-2xl">
									<UIcon :name="section.icon" class="w-6 h-6" />
								</div>
								<div>
									<h2 class="text-3xl font-black tracking-tight">{{ section.label }}</h2>
									<p class="text-sm text-gray-500 font-medium">Bearbeiten Sie die {{ section.label.toLowerCase() }} für Ihre Gäste.</p>
								</div>
							</div>

							<div class="pt-2">
								<component :is="section.component" :home="home" @refresh="fetchHome" />
							</div>
						</div>

						<!-- Visual Divider -->
						<div v-if="index !== orderedSections.length - 1" class="mt-24 h-px bg-gray-100 dark:bg-gray-800" />
					</section>
				</div>
			</main>
		</div>
	</div>
</template>

<style scoped>
/* Optional: Smooth fade for sections when reordering */
.section-move {
	transition: transform 0.5s ease;
}
</style>
