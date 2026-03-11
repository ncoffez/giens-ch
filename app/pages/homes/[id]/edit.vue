<script setup lang="ts">
definePageMeta({ middleware: ["home-owner"] });

import type { Home, HomeShare, HomeContact } from "~/types";
import HomeFiles from "~/components/homes/HomeFiles.vue";
import HomePhotos from "~/components/homes/HomePhotos.vue";
import HomeShareLinks from "~/components/homes/HomeShareLinks.vue";
import ContactCard from "~/components/homes/ContactCard.vue";

const { waitForAuth, token } = useAuthReady();
const route = useRoute();
const toast = useToast();

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

const fetchHome = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		error.value = null;
		console.log("[edit-home] Fetching home:", homeId.value);

		const [homeData, sharesData] = await Promise.all([
			$fetch(`/api/homes/${homeId.value}`, {
				headers: { Authorization: `Bearer ${token.value}` },
			}),
			$fetch(`/api/homes/${homeId.value}/share/list`, {
				headers: { Authorization: `Bearer ${token.value}` },
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
		error.value = getFetchError(e) || "Fehler beim Laden";
	} finally {
		loading.value = false;
	}
};

const saveBasicInfo = async () => {
	try {
		saving.value = true;
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				name: formName.value,
				wifiSSID: formWifiSSID.value,
				wifiPassword: formWifiPassword.value,
				instructions: formInstructions.value,
			},
		});
		toast.add({ title: "Gespeichert", color: "success" });
		await fetchHome();
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Speichern", description: getFetchError(e), color: "error" });
	} finally {
		saving.value = false;
	}
};

const saveContacts = async () => {
	try {
		saving.value = true;
		await $fetch(`/api/homes/${homeId.value}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				contacts: formContacts.value,
			},
		});
		toast.add({ title: "Kontakte gespeichert", color: "success" });
		await fetchHome();
	} catch (e: unknown) {
		toast.add({ title: "Fehler beim Speichern", description: getFetchError(e), color: "error" });
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
		toast.add({ title: "Name erforderlich", color: "warning" });
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
		toast.add({ title: "Eigentümer können nicht gelöscht werden", description: "Sie können sie stattdessen verstecken.", color: "warning" });
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
		toast.add({ title: "Kein aktiver Link", description: "Erstellen Sie zuerst einen Link.", color: "warning" });
	}
};

onMounted(fetchHome);
</script>

<template>
	<div class="min-h-screen bg-stone-50 dark:bg-stone-900">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
			<div class="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<UButton
						variant="ghost"
						color="neutral"
						icon="i-lucide-arrow-left"
						@click="navigateTo('/my-homes')"
					/>
					<h1 v-if="home" class="font-black text-lg">{{ home.name }}</h1>
				</div>
				<div class="flex items-center gap-2">
					<UButton
						variant="soft"
						color="neutral"
						icon="i-lucide-eye"
						@click="openPreview"
						:disabled="!previewUrl"
					>
						Vorschau
					</UButton>
				</div>
			</div>
		</header>

		<div class="max-w-screen-xl mx-auto px-4 py-8">
			<!-- Loading -->
			<div v-if="loading" class="flex items-center justify-center py-20">
				<div class="text-center space-y-4">
					<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p class="text-stone-500">Laden...</p>
				</div>
			</div>

			<!-- Error -->
			<div v-else-if="error" class="text-center py-20">
				<div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
					<UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-red-500" />
				</div>
				<p class="text-red-600 font-medium mb-4">{{ error }}</p>
				<UButton color="neutral" variant="soft" @click="fetchHome">Erneut versuchen</UButton>
			</div>

			<!-- Main Content -->
			<template v-else-if="home">
				<div class="flex flex-col lg:flex-row gap-8">
					<!-- Sidebar Navigation -->
					<aside class="lg:w-64 shrink-0">
						<nav class="lg:sticky lg:top-24 space-y-1">
							<button
								v-for="section in [
									{ id: 'links', label: 'Links', icon: 'i-lucide-link' },
									{ id: 'photos', label: 'Fotos', icon: 'i-lucide-image' },
									{ id: 'wifi', label: 'WLAN', icon: 'i-lucide-wifi' },
									{ id: 'contacts', label: 'Kontakte', icon: 'i-lucide-users' },
									{ id: 'instructions', label: 'Anleitung', icon: 'i-lucide-file-text' },
									{ id: 'files', label: 'Dateien', icon: 'i-lucide-folder' },
								]"
								:key="section.id"
								@click="activeSection = section.id as any"
								class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
								:class="activeSection === section.id
									? 'bg-primary text-white'
									: 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'"
							>
								<UIcon :name="section.icon" class="w-5 h-5" />
								<span class="font-medium">{{ section.label }}</span>
							</button>
						</nav>
					</aside>

					<!-- Content Area -->
					<main class="flex-1">
						<!-- Share Links Section -->
						<div v-if="activeSection === 'links'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">Links verwalten</h2>
								<p class="text-stone-500">Erstellen Sie Links, die Sie mit Mietern teilen können.</p>
							</div>
							<HomeShareLinks :home-id="homeId" :shares="shares" @refresh="fetchHome" />
						</div>

						<!-- Photos Section -->
						<div v-else-if="activeSection === 'photos'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">Fotos</h2>
								<p class="text-stone-500">Laden Sie Fotos hoch, die Mieter sehen können.</p>
							</div>
							<HomePhotos :home="home" @refresh="fetchHome" />
						</div>

						<!-- WiFi Section -->
						<div v-else-if="activeSection === 'wifi'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">WLAN-Zugang</h2>
								<p class="text-stone-500">Teilen Sie die WLAN-Daten mit Ihren Mietern.</p>
							</div>
							<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-6">
								<UFormField label="Netzwerkname (SSID)">
									<UInput
										v-model="formWifiSSID"
										placeholder="z.B. MeinWLAN"
										size="xl"
									/>
								</UFormField>

								<UFormField label="Passwort">
									<div class="flex gap-2">
										<UInput
											v-model="formWifiPassword"
											:type="showWifi ? 'text' : 'password'"
											placeholder="WLAN-Passwort"
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
										Speichern
									</UButton>
								</div>
							</div>
						</div>

						<!-- Contacts Section -->
						<div v-else-if="activeSection === 'contacts'" class="space-y-6">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-2xl font-black mb-2">Kontakte</h2>
									<p class="text-stone-500">Verwalten Sie Kontaktpersonen für Ihre Mieter.</p>
								</div>
								<UButton
									icon="i-lucide-plus"
									@click="openContactModal()"
								>
									Kontakt hinzufügen
								</UButton>
							</div>

							<div v-if="formContacts.length === 0" class="text-center py-12 bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
								<UIcon name="i-lucide-users" class="w-12 h-12 text-stone-300 mx-auto mb-4" />
								<p class="text-stone-500">Keine Kontakte vorhanden</p>
								<UButton class="mt-4" @click="openContactModal()">
									Ersten Kontakt hinzufügen
								</UButton>
							</div>

							<div v-else class="space-y-4">
								<div v-for="contact in formContacts" :key="contact.id" class="relative">
									<ContactCard :contact="contact" :show-hidden-badge="true" />
									<div class="absolute top-4 right-4 flex items-center gap-2">
										<UButton
											:icon="contact.hidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
											color="neutral"
											variant="ghost"
											size="sm"
											@click="toggleContactHidden(contact.id)"
											:title="contact.hidden ? 'Anzeigen' : 'Verstecken'"
										/>
										<UButton
											v-if="!contact.isOwner"
											icon="i-lucide-pencil"
											color="neutral"
											variant="ghost"
											size="sm"
											@click="openContactModal(contact)"
										/>
										<UButton
											v-if="!contact.isOwner"
											icon="i-lucide-trash-2"
											color="error"
											variant="ghost"
											size="sm"
											@click="deleteContact(contact.id)"
										/>
									</div>
								</div>
							</div>
						</div>

						<!-- Instructions Section -->
						<div v-else-if="activeSection === 'instructions'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">Anleitung</h2>
								<p class="text-stone-500">Schreiben Sie eine Anleitung für Ihre Mieter.</p>
							</div>
							<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
								<TiptapEditor v-model="formInstructions" />
								<div class="flex justify-end mt-6">
									<UButton :loading="saving" @click="saveBasicInfo" icon="i-lucide-save">
										Speichern
									</UButton>
								</div>
							</div>
						</div>

						<!-- Files Section -->
						<div v-else-if="activeSection === 'files'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">Dateien</h2>
								<p class="text-stone-500">Laden Sie Dokumente hoch, die Mieter herunterladen können.</p>
							</div>
							<HomeFiles :home="home" @refresh="fetchHome" />
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
						{{ editingContact ? "Kontakt bearbeiten" : "Neuer Kontakt" }}
					</h3>

					<div class="space-y-4">
						<UFormField label="Name" required>
							<UInput v-model="contactForm.name" placeholder="Vorname Nachname" size="xl" />
						</UFormField>

						<UFormField label="E-Mail">
							<UInput v-model="contactForm.email" type="email" placeholder="email@beispiel.ch" size="xl" />
						</UFormField>

						<UFormField label="Telefon">
							<UInput v-model="contactForm.phone" type="tel" placeholder="+41 79 123 45 67" size="xl" />
						</UFormField>

						<UFormField label="Notizen">
							<UInput v-model="contactForm.notes" placeholder="z.B. Hausverwaltung, Nachbar" size="xl" />
						</UFormField>

						<UFormField label="Versteckt">
							<USwitch v-model="contactForm.hidden" />
							<p class="text-xs text-stone-500 mt-1">Versteckte Kontakte werden Mietern nicht angezeigt.</p>
						</UFormField>
					</div>

					<div class="flex justify-end gap-2 mt-6">
						<UButton color="neutral" variant="ghost" @click="showContactModal = false">
							Abbrechen
						</UButton>
						<UButton @click="saveContact">
							Speichern
						</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>
