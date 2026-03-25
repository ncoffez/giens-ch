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
const localePath = useLocalePath();

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
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">Mein Haus</p>
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
					<aside class="lg:w-72 shrink-0">
						<div class="app-card rounded-[1.75rem] p-4 lg:sticky lg:top-24">
						<nav class="space-y-1">
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
									<p class="text-stone-500">Pflegen Sie Eigentümer- und Zusatzkontakte, damit Gäste die richtigen Ansprechpartner erreichen.</p>
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

							<div v-else class="space-y-6">
								<section v-if="ownerContacts.length > 0" class="space-y-4">
									<div class="space-y-1">
										<h3 class="text-lg font-bold">Eigentümer</h3>
										<p class="text-sm text-stone-500">Name und Profil bleiben erhalten, E-Mail, Telefon und Hinweise können hier hausbezogen ergänzt werden.</p>
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
													:title="contact.hidden ? 'Anzeigen' : 'Verstecken'"
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
										<h3 class="text-lg font-bold">Weitere Kontakte</h3>
										<p class="text-sm text-stone-500">Hauswartung, Nachbarschaft oder lokale Hilfeleistungen lassen sich hier separat pflegen.</p>
									</div>
									<div v-if="additionalContacts.length === 0" class="rounded-2xl border border-dashed border-stone-200 bg-white/70 px-6 py-8 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-800/60">
										Noch keine zusätzlichen Kontakte vorhanden.
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
													:title="contact.hidden ? 'Anzeigen' : 'Verstecken'"
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
								<h2 class="text-2xl font-black mb-2">Anleitung</h2>
								<p class="text-stone-500">Hinterlegen Sie die wichtigsten Hinweise für Ankunft, Aufenthalt und Abreise in einer klaren, gut lesbaren Struktur.</p>
							</div>
							<div class="flex items-start justify-between gap-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4">
								<div class="space-y-1">
									<p class="text-sm font-semibold text-[var(--app-text)]">Hinweise für Gäste</p>
									<p class="text-sm text-[var(--app-muted)]">Der Editor bringt bereits seine eigene Oberfläche mit. Die Abschnittskarte bleibt deshalb bewusst schlank.</p>
								</div>
								<UButton :loading="saving" @click="saveBasicInfo" icon="i-lucide-save">
									Speichern
								</UButton>
							</div>
							<TiptapEditor v-model="formInstructions" />
						</div>

						<!-- Files Section -->
						<div v-else-if="activeSection === 'files'" class="space-y-6">
							<div>
								<h2 class="text-2xl font-black mb-2">Dateien</h2>
								<p class="text-stone-500">Laden Sie Dokumente hoch, die Mieter herunterladen können.</p>
							</div>
							<div class="grid gap-6 xl:grid-cols-2">
								<div class="space-y-4">
									<div>
										<h3 class="text-lg font-bold">Für Besucher freigegeben</h3>
										<p class="text-sm text-stone-500">Diese Dateien sind über aktive Haus-Links sichtbar.</p>
									</div>
									<HomeFiles :home="home" @refresh="fetchHome" />
								</div>
								<div class="space-y-4">
									<div>
										<h3 class="text-lg font-bold">Privat für Eigentümer</h3>
										<p class="text-sm text-stone-500">Diese Dateien bleiben intern und erscheinen nie im Besucherzugriff.</p>
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
						{{ editingContact ? (isEditingOwnerContact ? "Eigentümerkontakt ergänzen" : "Kontakt bearbeiten") : "Neuer Kontakt" }}
					</h3>

					<div class="space-y-4">
						<UFormField label="Name" required>
							<UInput v-model="contactForm.name" placeholder="Vorname Nachname" size="xl" :disabled="isEditingOwnerContact" />
							<p v-if="isEditingOwnerContact" class="mt-1 text-xs text-stone-500">
								Der Name kommt aus dem Eigentümerprofil. Hier ergänzen Sie nur die Kontaktdaten für dieses Haus.
							</p>
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
