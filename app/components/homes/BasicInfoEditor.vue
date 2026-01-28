<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	name: props.home?.name || "",
	wifiPassword: props.home?.wifiPassword || "",
	parkingNumber: props.home?.parkingNumber || "",
	contact: {
		name: props.home?.contact?.name || "",
		phone: props.home?.contact?.phone || "",
		email: props.home?.contact?.email || "",
	},
});

const showWifi = ref(false);
const loading = ref(false);

const save = async () => {
	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: form,
		});
		toast.add({ title: "Erfolgreich gespeichert!", color: "success" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Fehler beim Speichern", color: "error" });
	} finally {
		loading.value = false;
	}
};

watch(() => props.home, (newHome) => {
	if (newHome) {
		form.name = newHome.name || "";
		form.wifiPassword = newHome.wifiPassword || "";
		form.parkingNumber = newHome.parkingNumber || "";
		form.contact.name = newHome.contact?.name || "";
		form.contact.phone = newHome.contact?.phone || "";
		form.contact.email = newHome.contact?.email || "";
	}
}, { immediate: true });
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2">
			<UCard>
				<template #header>
					<h3 class="text-lg font-bold">Grundinformationen</h3>
				</template>
				
				<form @submit.prevent="save" class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<UFormField label="Name des Hauses" description="Beispiel: 7 oder Strandhaus">
							<UInput v-model="form.name" placeholder="Haus Name" />
						</UFormField>

						<UFormField label="Parkplatz-Nummer" description="Nummer des zugewiesenen Parkplatzes">
							<UInput v-model="form.parkingNumber" placeholder="z.B. P7" />
						</UFormField>
					</div>

					<UFormField label="WLAN Passwort" description="Klicken Sie auf das Auge, um das Passwort anzuzeigen">
						<div class="flex gap-2">
							<UInput 
								v-model="form.wifiPassword" 
								:type="showWifi ? 'text' : 'password'" 
								placeholder="WLAN Passwort" 
								class="flex-1"
							/>
							<UButton 
								:icon="showWifi ? 'i-lucide-eye-off' : 'i-lucide-eye'" 
								color="neutral" 
								variant="ghost" 
								@click="showWifi = !showWifi"
							/>
						</div>
					</UFormField>

					<div class="pt-4 border-t border-gray-100 dark:border-gray-800">
						<h4 class="font-bold mb-4 flex items-center gap-2">
							<UIcon name="i-lucide-contact" class="text-primary" />
							Kontaktinformationen
						</h4>
						<div class="space-y-4">
							<UFormField label="Ansprechpartner">
								<UInput v-model="form.contact.name" placeholder="Name des Eigentümers oder Verwalters" />
							</UFormField>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<UFormField label="Telefon">
									<UInput v-model="form.contact.phone" placeholder="+41 ..." type="tel" />
								</UFormField>

								<UFormField label="E-Mail">
									<UInput v-model="form.contact.email" placeholder="email@example.com" type="email" />
								</UFormField>
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-4">
						<UButton type="submit" size="lg" :loading="loading" icon="i-lucide-save">
							Änderungen speichern
						</UButton>
					</div>
				</form>
			</UCard>
		</div>

		<div class="lg:col-span-1">
			<UCard class="bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
				<h3 class="font-black text-primary mb-2 flex items-center gap-2">
					<UIcon name="i-lucide-info" />
					Tipp
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Diese Informationen werden allen Bewohnern und Gästen angezeigt, die Zugriff auf dieses Haus haben. Halten Sie die Kontaktdaten aktuell, damit Sie bei Notfällen erreichbar sind.
				</p>
			</UCard>
		</div>
	</div>
</template>
