<script setup lang="ts">
definePageMeta({ middleware: ["home-owner"] });

import type { Home, HomeShare, HomeContact } from "~/types";
import HomeFiles from "~/components/homes/HomeFiles.vue";
import HomePhotos from "~/components/homes/HomePhotos.vue";
import HomeShareLinks from "~/components/homes/HomeShareLinks.vue";
import ContactCard from "~/components/homes/ContactCard.vue";

const { waitForAuth, getFreshToken } = useAuthReady();
const route = useRoute();
const toast = useToast();
const localePath = useLocalePath();
const { t } = useI18n();

const homeId = computed(() => route.params.id as string);
const home = ref<Home | null>(null);
const shares = ref<HomeShare[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

// Form data
const formName = ref("");
const formWifiSSID = ref("");
const formWifiPassword = ref("");
const formInstructions = ref("");
const formContacts = ref<HomeContact[]>([]);
const showWifi = ref(false);

// Active section
const activeSection = ref<"links" | "photos" | "wifi" | "instructions" | "files" | "contacts">("links");

// Preview
const previewUrl = ref<string | null>(null);

// Contact editing
const editingContact = ref<HomeContact | null>(null);
const showContactModal = ref(false);
const contactForm = ref({
	name: "",
	email: "",
	phone: "",
	notes: "",
	hidden: false,
});
const ownerContacts = computed(() => formContacts.value.filter((contact) => contact.isOwner));
const additionalContacts = computed(() => formContacts.value.filter((contact) => !contact.isOwner));
const isEditingOwnerContact = computed(() => Boolean(editingContact.value?.isOwner));
const sectionItems = computed(() => [
	{ id: "links", label: t("homes.edit.sections.links"), icon: "i-lucide-link" },
	{ id: "photos", label: t("homes.edit.sections.photos"), icon: "i-lucide-image" },
	{ id: "wifi", label: t("homes.edit.sections.wifi"), icon: "i-lucide-wifi" },
	{ id: "contacts", label: t("homes.edit.sections.contacts"), icon: "i-lucide-users" },
	{ id: "instructions", label: t("homes.edit.sections.instructions"), icon: "i-lucide-file-text" },
	{ id: "files", label: t("homes.edit.sections.files"), icon: "i-lucide-folder" },
]);
const contactModalTitle = computed(() => {
	if (!editingContact.value) {
		return t("homes.edit.contactModal.createTitle");
	}

	return isEditingOwnerContact.value
		? t("homes.edit.contactModal.ownerTitle")
		: t("homes.edit.contactModal.editTitle");
});

const fetchHome = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		const authToken = await getFreshToken();
		console.log("[edit-home] Fetching home:", homeId.value);

		const [homeData, sharesData] = await Promise.all([
			$fetch(`/api/homes/${homeId.value}`, {
				headers: { Authorization: `Bearer ${authToken}` },
			}),
			$fetch(`/api/homes/${homeId.value}/share/list`, {
				headers: { Authorization: `Bearer ${authToken}` },
			}),
		]);

		home.value = homeData as Home;
		shares.value = sharesData as HomeShare[];

		// Populate form
		formName.value = home.value.name;
		formWifiSSID.value = home.value.wifiSSID || "";
		formWifiPassword.value = home.value.wifiPassword || "";
		formInstructions.value = home.value.instructions || "";
		formContacts.value = [...(home.value.contacts || [])];

		// Get latest active share for preview
		const activeShare = shares.value.find(s => !s.revoked && new Date(s.expiresAt) > new Date());
		if (activeShare) {
			previewUrl.value = (activeShare as any).shareUrl;
		}

		console.log("[edit-home] Home loaded:", home.value.name);
	} catch (e: unknown) {
		console.error("[edit-home] Error fetching home:", e);
		error.value = getFetchError(e) || t("homes.edit.toasts.loadError");
	} finally {
		loading.value = false;
	}
};

const saveBasicInfo = async () => {
	try {
		saving.value = true;
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: {
				name: formName.value,
				wifiSSID: formWifiSSID.value,
				wifiPassword: formWifiPassword.value,
				instructions: formInstructions.value,
			},
		});
		toast.add({ title: t("homes.edit.toasts.saved"), color: "success" });
		await fetchHome();
	} catch (e: unknown) {
		toast.add({ title: t("homes.edit.toasts.saveError"), description: getFetchError(e), color: "error" });
	} finally {
		saving.value = false;
	}
};

const saveContacts = async () => {
	try {
		saving.value = true;
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: {
				contacts: formContacts.value,
			},
		});
		toast.add({ title: t("homes.edit.toasts.contactsSaved"), color: "success" });
		await fetchHome();
	} catch (e: unknown) {
		toast.add({ title: t("homes.edit.toasts.saveError"), description: getFetchError(e), color: "error" });
	} finally {
		saving.value = false;
	}
};

const openContactModal = (contact?: HomeContact) => {
	if (contact) {
		editingContact.value = contact;
		contactForm.value = {
			name: contact.name,
			email: contact.email || "",
			phone: contact.phone || "",
			notes: contact.notes || "",
			hidden: contact.hidden,
		};
	} else {
		editingContact.value = null;
		contactForm.value = {
			name: "",
			email: "",
			phone: "",
			notes: "",
			hidden: false,
		};
	}
	showContactModal.value = true;
};

const saveContact = () => {
	if (!contactForm.value.name.trim()) {
		toast.add({ title: t("homes.edit.toasts.nameRequired"), color: "warning" });
		return;
	}

	if (editingContact.value) {
		// Update existing contact
		const index = formContacts.value.findIndex(c => c.id === editingContact.value!.id);
		if (index !== -1) {
			formContacts.value[index] = {
				...formContacts.value[index],
				name: contactForm.value.name,
				email: contactForm.value.email || undefined,
				phone: contactForm.value.phone || undefined,
				notes: contactForm.value.notes || undefined,
				hidden: contactForm.value.hidden,
			};
		}
	} else {
		// Add new contact
		const newContact: HomeContact = {
			id: `contact-${Date.now()}`,
			name: contactForm.value.name,
			email: contactForm.value.email || undefined,
			phone: contactForm.value.phone || undefined,
			notes: contactForm.value.notes || undefined,
			hidden: contactForm.value.hidden,
			isOwner: false,
		};
		formContacts.value.push(newContact);
	}

	showContactModal.value = false;
	saveContacts();
};

const deleteContact = (contactId: string) => {
	const contact = formContacts.value.find(c => c.id === contactId);
	if (contact?.isOwner) {
		toast.add({
			title: t("homes.edit.toasts.ownerDeleteForbiddenTitle"),
			description: t("homes.edit.toasts.ownerDeleteForbiddenDescription"),
			color: "warning",
		});
		return;
	}

	const index = formContacts.value.findIndex(c => c.id === contactId);
	if (index !== -1) {
		formContacts.value.splice(index, 1);
		saveContacts();
	}
};

const toggleContactHidden = (contactId: string) => {
	const index = formContacts.value.findIndex(c => c.id === contactId);
	if (index !== -1) {
		formContacts.value[index].hidden = !formContacts.value[index].hidden;
		saveContacts();
	}
};

const openPreview = () => {
	if (previewUrl.value) {
		window.open(previewUrl.value, "_blank");
	} else {
		toast.add({
			title: t("homes.edit.toasts.noActiveLinkTitle"),
			description: t("homes.edit.toasts.noActiveLinkDescription"),
			color: "warning",
		});
	}
};

onMounted(fetchHome);
</script>

<template>
	<div class="min-h-screen">
		<!-- Header -->
		<header class="sticky top-0 z-50 py-3">
			<div class="app-surface max-w-screen-xl mx-auto px-4 h-16 rounded-[1.5rem] flex items-center justify-between">
				<div class="flex items-center gap-4">
					<UButton
						variant="ghost"
						color="neutral"
						icon="i-lucide-arrow-left"
						@click="navigateTo(localePath('/my-homes'))"
					/>
					<div v-if="home">
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">{{ t("homes.edit.eyebrow") }}</p>
						<h1 class="display-copy font-bold text-xl">{{ home.name }}</h1>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<UButton
						variant="soft"
						color="neutral"
						icon="i-lucide-eye"
						@click="openPreview"
						:disabled="!previewUrl"
					>
						{{ t("homes.edit.preview") }}
					</UButton>
				</div>
			</div>
		</header>

		<div class="max-w-screen-xl mx-auto px-4 py-8">
			<!-- Loading -->
			<div v-if="loading" class="flex items-center justify-center py-20">
				<div class="text-center space-y-4">
					<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p class="text-stone-500">{{ t("homes.edit.loading") }}</p>
				</div>
			</div>

			<!-- Error -->
			<div v-else-if="error" class="text-center py-20">
				<div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
					<UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-red-500" />
				</div>
				<p class="text-red-600 font-medium mb-4">{{ error }}</p>
				<UButton color="neutral" variant="soft" @click="fetchHome">{{ t("homes.edit.retry") }}</UButton>
			</div>

			<!-- Main Content -->
			<template v-else-if="home">
				<div class="flex flex-col lg:flex-row gap-8">
					<!-- Sidebar Navigation -->
					<aside class="lg:w-72 shrink-0">
						<div class="app-card rounded-[1.75rem] p-4 lg:sticky lg:top-24">
						<nav class="space-y-1">
							<button
								v-for="section in sectionItems"
								:key="section.id"
								@click="activeSection = section.id as any"
								class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
								:class="activeSection === section.id
									? 'border border-[var(--app-primary)]/20 bg-[var(--app-primary)]/10 text-[var(--app-text)] shadow-none'
									: 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-white/[0.04]'"
							>
								<UIcon :name="section.icon" class="w-5 h-5" />
								<span class="font-medium">{{ section.label }}</span>
							</button>
						</nav>
						</div>
					</aside>

					<!-- Content Area -->
					<main class="flex-1">
						<!-- Share Links Section -->
						<div v-if="activeSection === 'links'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.links.title") }}</h2>
								<p class="text-stone-500">{{ t("homes.edit.links.description") }}</p>
							</div>
							<HomeShareLinks :home-id="homeId" :shares="shares" @refresh="fetchHome" />
						</div>

						<!-- Photos Section -->
						<div v-else-if="activeSection === 'photos'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.photos.title") }}</h2>
								<p class="text-stone-500">{{ t("homes.edit.photos.description") }}</p>
							</div>
							<HomePhotos :home="home" @refresh="fetchHome" />
						</div>

						<!-- WiFi Section -->
						<div v-else-if="activeSection === 'wifi'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.wifi.title") }}</h2>
								<p class="text-stone-500">{{ t("homes.edit.wifi.description") }}</p>
							</div>
							<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-6">
								<UFormField :label="t('homes.edit.wifi.ssidLabel')">
									<UInput
										v-model="formWifiSSID"
										:placeholder="t('homes.edit.wifi.ssidPlaceholder')"
										size="xl"
									/>
								</UFormField>

								<UFormField :label="t('homes.edit.wifi.passwordLabel')">
									<div class="flex gap-2">
										<UInput
											v-model="formWifiPassword"
											:type="showWifi ? 'text' : 'password'"
											:placeholder="t('homes.edit.wifi.passwordPlaceholder')"
											size="xl"
											class="flex-1"
										/>
										<UButton
											:icon="showWifi ? 'i-lucide-eye-off' : 'i-lucide-eye'"
											color="neutral"
											variant="soft"
											size="xl"
											@click="showWifi = !showWifi"
										/>
									</div>
								</UFormField>

								<div class="flex justify-end">
									<UButton :loading="saving" @click="saveBasicInfo" icon="i-lucide-save">
										{{ t("homes.edit.actions.save") }}
									</UButton>
								</div>
							</div>
						</div>

						<!-- Contacts Section -->
						<div v-else-if="activeSection === 'contacts'" class="space-y-6">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.contacts.title") }}</h2>
									<p class="text-stone-500">{{ t("homes.edit.contacts.description") }}</p>
								</div>
								<UButton
									icon="i-lucide-plus"
									@click="openContactModal()"
								>
									{{ t("homes.edit.contacts.add") }}
								</UButton>
							</div>

							<div v-if="formContacts.length === 0" class="text-center py-12 bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
								<UIcon name="i-lucide-users" class="w-12 h-12 text-stone-300 mx-auto mb-4" />
								<p class="text-stone-500">{{ t("homes.edit.contacts.emptyTitle") }}</p>
								<UButton class="mt-4" @click="openContactModal()">
									{{ t("homes.edit.contacts.emptyAction") }}
								</UButton>
							</div>

							<div v-else class="space-y-6">
								<section v-if="ownerContacts.length > 0" class="space-y-4">
									<div class="space-y-1">
										<h3 class="text-lg font-bold">{{ t("homes.edit.contacts.ownerTitle") }}</h3>
										<p class="text-sm text-stone-500">{{ t("homes.edit.contacts.ownerDescription") }}</p>
									</div>
									<div class="grid gap-4 xl:grid-cols-2">
										<ContactCard
											v-for="contact in ownerContacts"
											:key="contact.id"
											:contact="contact"
											:show-hidden-badge="true">
											<template #actions>
												<UButton
													:icon="contact.hidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
													color="neutral"
													variant="ghost"
													size="sm"
													@click="toggleContactHidden(contact.id)"
													:title="contact.hidden ? t('homes.edit.contacts.show') : t('homes.edit.contacts.hide')"
												/>
												<UButton
													icon="i-lucide-pencil"
													color="neutral"
													variant="ghost"
													size="sm"
													@click="openContactModal(contact)"
												/>
											</template>
										</ContactCard>
									</div>
								</section>

								<section class="space-y-4">
									<div class="space-y-1">
										<h3 class="text-lg font-bold">{{ t("homes.edit.contacts.additionalTitle") }}</h3>
										<p class="text-sm text-stone-500">{{ t("homes.edit.contacts.additionalDescription") }}</p>
									</div>
									<div v-if="additionalContacts.length === 0" class="rounded-2xl border border-dashed border-stone-200 bg-white/70 px-6 py-8 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-800/60">
										{{ t("homes.edit.contacts.additionalEmpty") }}
									</div>
									<div v-else class="grid gap-4 xl:grid-cols-2">
										<ContactCard
											v-for="contact in additionalContacts"
											:key="contact.id"
											:contact="contact"
											:show-hidden-badge="true">
											<template #actions>
												<UButton
													:icon="contact.hidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
													color="neutral"
													variant="ghost"
													size="sm"
													@click="toggleContactHidden(contact.id)"
													:title="contact.hidden ? t('homes.edit.contacts.show') : t('homes.edit.contacts.hide')"
												/>
												<UButton
													icon="i-lucide-pencil"
													color="neutral"
													variant="ghost"
													size="sm"
													@click="openContactModal(contact)"
												/>
												<UButton
													icon="i-lucide-trash-2"
													color="error"
													variant="ghost"
													size="sm"
													@click="deleteContact(contact.id)"
												/>
											</template>
										</ContactCard>
									</div>
								</section>
							</div>
						</div>

						<!-- Instructions Section -->
						<div v-else-if="activeSection === 'instructions'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.instructions.title") }}</h2>
								<p class="text-stone-500">{{ t("homes.edit.instructions.description") }}</p>
							</div>
							<div class="flex items-start justify-between gap-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4">
								<div class="space-y-1">
									<p class="text-sm font-semibold text-[var(--app-text)]">{{ t("homes.edit.instructions.cardTitle") }}</p>
									<p class="text-sm text-[var(--app-muted)]">{{ t("homes.edit.instructions.cardDescription") }}</p>
								</div>
								<UButton :loading="saving" @click="saveBasicInfo" icon="i-lucide-save">
									{{ t("homes.edit.actions.save") }}
								</UButton>
							</div>
							<TiptapEditor v-model="formInstructions" />
						</div>

						<!-- Files Section -->
						<div v-else-if="activeSection === 'files'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">{{ t("homes.edit.files.title") }}</h2>
								<p class="text-stone-500">{{ t("homes.edit.files.description") }}</p>
							</div>
							<div class="grid gap-6 xl:grid-cols-2">
								<div class="space-y-4">
									<div>
										<h3 class="text-lg font-bold">{{ t("homes.edit.files.sharedTitle") }}</h3>
										<p class="text-sm text-stone-500">{{ t("homes.edit.files.sharedDescription") }}</p>
									</div>
									<HomeFiles :home="home" @refresh="fetchHome" />
								</div>
								<div class="space-y-4">
									<div>
										<h3 class="text-lg font-bold">{{ t("homes.edit.files.privateTitle") }}</h3>
										<p class="text-sm text-stone-500">{{ t("homes.edit.files.privateDescription") }}</p>
									</div>
									<HomeFiles :home="home" privacy="private" @refresh="fetchHome" />
								</div>
							</div>
						</div>
					</main>
				</div>
			</template>
		</div>

		<!-- Contact Modal -->
		<UModal v-model:open="showContactModal">
			<template #content>
				<div class="p-6">
					<h3 class="text-lg font-bold mb-4">
						{{ contactModalTitle }}
					</h3>

					<div class="space-y-4">
						<UFormField :label="t('homes.edit.contactModal.nameLabel')" required>
							<UInput v-model="contactForm.name" :placeholder="t('homes.edit.contactModal.namePlaceholder')" size="xl" :disabled="isEditingOwnerContact" />
							<p v-if="isEditingOwnerContact" class="mt-1 text-xs text-stone-500">
								{{ t("homes.edit.contactModal.ownerHint") }}
							</p>
						</UFormField>

						<UFormField :label="t('homes.edit.contactModal.emailLabel')">
							<UInput v-model="contactForm.email" type="email" :placeholder="t('homes.edit.contactModal.emailPlaceholder')" size="xl" />
						</UFormField>

						<UFormField :label="t('homes.edit.contactModal.phoneLabel')">
							<UInput v-model="contactForm.phone" type="tel" :placeholder="t('homes.edit.contactModal.phonePlaceholder')" size="xl" />
						</UFormField>

						<UFormField :label="t('homes.edit.contactModal.notesLabel')">
							<UInput v-model="contactForm.notes" :placeholder="t('homes.edit.contactModal.notesPlaceholder')" size="xl" />
						</UFormField>

						<UFormField :label="t('homes.edit.contactModal.hiddenLabel')">
							<USwitch v-model="contactForm.hidden" />
							<p class="text-xs text-stone-500 mt-1">{{ t("homes.edit.contactModal.hiddenHint") }}</p>
						</UFormField>
					</div>

					<div class="flex justify-end gap-2 mt-6">
						<UButton color="neutral" variant="ghost" @click="showContactModal = false">
							{{ t("homes.edit.actions.cancel") }}
						</UButton>
						<UButton @click="saveContact">
							{{ t("homes.edit.actions.save") }}
						</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>
