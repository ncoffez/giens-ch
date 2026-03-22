<script setup lang="ts">
import ProfilePictureModal from "~/components/ui/ProfilePictureModal.vue";
import PasswordChangeModal from "~/components/ui/PasswordChangeModal.vue";

const { $currentUser } = useNuxtApp();

if (!$currentUser || !$currentUser.value) {
	navigateTo("/login");
}

const uid = $currentUser?.value?.uid || "";

const {
	data: profile,
	status,
	error,
	refresh,
} = await useFetch<any>(`/api/profile/${uid}`, {
	cache: "no-cache",
});

const isPictureModalOpen = ref(false);
const isPasswordModalOpen = ref(false);
</script>

<template>
	<div class="max-w-screen-xl mx-auto px-4 py-12">
		<div v-if="status === 'pending'" class="flex justify-center py-20">
			<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
		</div>

		<div v-else-if="profile" class="space-y-16">
			<div class="flex flex-col items-center text-center space-y-6">
				<div class="relative">
					<UAvatar
						:src="profile.photoURL"
						:alt="profile.displayName"
						size="xl"
						class="w-32 h-32 ring-4 ring-primary/10 shadow-xl"
						:ui="{
							rounded: 'rounded-full',
							text: 'text-3xl font-black',
						}" />
					<ClientOnly>
						<UButton
							icon="i-lucide-camera"
							size="sm"
							color="neutral"
							variant="soft"
							class="absolute bottom-0 right-0"
							@click="isPictureModalOpen = true">
							Ändern
						</UButton>
					</ClientOnly>
				</div>
				<div>
					<h1 class="text-4xl font-black tracking-tight">{{ profile.displayName }}</h1>
					<p v-if="profile.email" class="text-stone-500 mt-2">{{ profile.email }}</p>
					<p class="text-stone-400 text-sm mt-1">Mitglied des Lotissement Beausoleil</p>
				</div>
			</div>

			<ClientOnly>
				<ProfilePictureModal v-model="isPictureModalOpen" @updated="refresh" />
				<PasswordChangeModal v-model="isPasswordModalOpen" />
			</ClientOnly>

			<section class="max-w-screen-md mx-auto border-t pt-12">
				<h2 class="text-xl font-bold mb-6">Konto-Einstellungen</h2>
				<div class="space-y-4">
					<ClientOnly>
						<UButton
							color="neutral"
							variant="soft"
							icon="i-lucide-lock"
							@click="isPasswordModalOpen = true">
							Passwort ändern
						</UButton>
					</ClientOnly>
				</div>
			</section>
		</div>
	</div>
</template>
