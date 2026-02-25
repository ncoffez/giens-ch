<script setup lang="ts">
import type { Home } from "../../types";

const props = defineProps<{ home: Home }>();
const emit = defineEmits(["refresh"]);

const { token } = useAuthReady();
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
			headers: { Authorization: `Bearer ${token.value}` },
			body: form,
		});
		toast.add({ title: "Erfolgreich gespeichert!", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Fehler beim Speichern", color: "error" });
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
	<form @submit.prevent="save" class="space-y-12">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<UFormField label="Name des Hauses" description="Beispiel: 7 oder Strandhaus">
				<UInput v-model="form.name" placeholder="Haus Name" size="xl" />
			</UFormField>

			<UFormField label="Parkplatz-Nummer" description="Nummer des zugewiesenen Parkplatzes">
				<UInput v-model="form.parkingNumber" placeholder="z.B. P7" size="xl" />
			</UFormField>
		</div>

		<UFormField label="WLAN Passwort" description="Klicken Sie auf das Auge, um das Passwort anzuzeigen">
			<div class="flex gap-2">
				<UInput 
					v-model="form.wifiPassword" 
					:type="showWifi ? 'text' : 'password'" 
					placeholder="WLAN Passwort" 
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

		<div class="pt-8 space-y-6">
			<div class="flex items-center gap-2 text-stone-400">
				<UIcon name="i-lucide-contact" class="w-4 h-4" />
				<h4 class="text-xs font-black uppercase tracking-widest">Kontaktinformationen</h4>
			</div>
			
			<div class="space-y-6">
				<UFormField label="Ansprechpartner">
					<UInput v-model="form.contact.name" placeholder="Name des Eigentümers oder Verwalters" size="lg" />
				</UFormField>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<UFormField label="Telefon">
						<UInput v-model="form.contact.phone" placeholder="+41 ..." type="tel" size="lg" />
					</UFormField>

					<UFormField label="E-Mail">
						<UInput v-model="form.contact.email" placeholder="email@example.com" type="email" size="lg" />
					</UFormField>
				</div>
			</div>
		</div>

		<div class="flex justify-end pt-8">
			<UButton type="submit" size="xl" :loading="loading" icon="i-lucide-save" class="rounded-full px-8">
				Grundinfos speichern
			</UButton>
		</div>
	</form>
</template>
