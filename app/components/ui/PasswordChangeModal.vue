<script setup lang="ts">
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const modelValue = defineModel<boolean>();

const { $currentUser } = useNuxtApp();
const toast = useToast();

const loading = ref(false);
const form = reactive({
	currentPassword: "",
	newPassword: "",
	confirmPassword: ""
});

async function handleSubmit() {
	if (!$currentUser?.value) return;

	if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
		toast.add({ color: "error", title: "Fehler", description: "Bitte alle Felder ausfüllen." });
		return;
	}

	if (form.newPassword.length < 6) {
		toast.add({ color: "error", title: "Fehler", description: "Das Passwort muss mindestens 6 Zeichen lang sein." });
		return;
	}

	if (form.newPassword !== form.confirmPassword) {
		toast.add({ color: "error", title: "Fehler", description: "Die Passwörter stimmen nicht überein." });
		return;
	}

	loading.value = true;
	try {
		const credential = EmailAuthProvider.credential(
			$currentUser.value.email!,
			form.currentPassword
		);
		await reauthenticateWithCredential($currentUser.value, credential);
		await updatePassword($currentUser.value, form.newPassword);
		
		toast.add({ color: "success", title: "Erfolg", description: "Passwort wurde aktualisiert." });
		modelValue.value = false;
		
		// Reset form
		form.currentPassword = "";
		form.newPassword = "";
		form.confirmPassword = "";
	} catch (error: any) {
		toast.add({ color: "error", title: "Fehler", description: error.message || "Konnte Passwort nicht aktualisieren." });
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<UModal :open="modelValue" @update:open="modelValue = $event" title="Passwort ändern">
		<template #content>
			<UForm :state="form" @submit="handleSubmit" class="p-6 space-y-6">
				<UFormField label="Aktuelles Passwort">
					<UInput 
						type="password" 
						v-model="form.currentPassword"
						placeholder="••••••••"
						icon="i-lucide-lock"
						block
					/>
				</UFormField>
				<UFormField label="Neues Passwort">
					<UInput 
						type="password" 
						v-model="form.newPassword"
						placeholder="Mindestens 6 Zeichen"
						icon="i-lucide-key-round"
						block
					/>
				</UFormField>
				<UFormField label="Passwort bestätigen">
					<UInput 
						type="password" 
						v-model="form.confirmPassword"
						placeholder="••••••••"
						icon="i-lucide-check-circle"
						block
					/>
				</UFormField>
				
				<div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
					<UButton variant="ghost" color="neutral" @click="modelValue = false">
						Abbrechen
					</UButton>
					<UButton type="submit" :loading="loading">
						Passwort aktualisieren
					</UButton>
				</div>
			</UForm>
		</template>
	</UModal>
</template>
