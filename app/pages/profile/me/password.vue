<template>
	<div class="max-w-screen-md mx-auto px-4 py-12">
		<div class="mb-8">
			<NuxtLink to="/profile/me" class="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
				<UIcon name="i-lucide-arrow-left" />
				zurück
			</NuxtLink>
		</div>
		
		<h1 class="text-3xl font-bold mb-8">Passwort ändern</h1>
		
		<UCard>
			<UForm :state="form" @submit="updatePassword" class="space-y-6">
				<UiInput 
					type="password" 
					label="Aktuelles Passwort" 
					v-model="form.currentPassword"
					placeholder="••••••••"
				/>
				<UiInput 
					type="password" 
					label="Neues Passwort" 
					v-model="form.newPassword"
					placeholder="Mindestens 6 Zeichen"
				/>
				<UiInput 
					type="password" 
					label="Passwort bestätigen" 
					v-model="form.confirmPassword"
					placeholder="••••••••"
				/>
				
				<UButton type="submit" :loading="loading">
					Passwort aktualisieren
				</UButton>
			</UForm>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const { $currentUser, $auth } = useNuxtApp();
const toast = useToast();

if (!$currentUser?.value) {
	navigateTo('/login');
}

const form = reactive({
	currentPassword: "",
	newPassword: "",
	confirmPassword: ""
});

const loading = ref(false);

async function updatePassword() {
	if (!$currentUser?.value) {
		navigateTo('/login');
		return;
	}

	if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Bitte alle Felder ausfüllen."
		});
		return;
	}

	if (form.newPassword.length < 6) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Das Passwort muss mindestens 6 Zeichen lang sein."
		});
		return;
	}

	if (form.newPassword !== form.confirmPassword) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: "Die Passwörter stimmen nicht überein."
		});
		return;
	}

	loading.value = true;
	try {
		const credential = EmailAuthProvider.credential(
			$currentUser.value.email,
			form.currentPassword
		);
		await reauthenticateWithCredential($currentUser.value, credential);
		await updatePassword($currentUser.value, form.newPassword);
		
		toast.add({
			color: "success",
			title: "Erfolg",
			description: "Passwort wurde aktualisiert."
		});
		
		navigateTo("/profile/me");
	} catch (error: any) {
		toast.add({
			color: "error",
			title: "Fehler",
			description: error.message || "Konnte Passwort nicht aktualisieren."
		});
	} finally {
		loading.value = false;
	}
}
</script>