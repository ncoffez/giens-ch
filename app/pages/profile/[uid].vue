<script setup lang="ts">
const route = useRoute();
const uid = route.params.uid as string;

const { data: profile, status, error } = await useFetch<any>(`/api/profile/${uid}`, {
	cache: "no-cache"
});
</script>

<template>
	<div class="max-w-screen-xl mx-auto px-4 py-12">
		<ClientOnly>
		<div v-if="status === 'pending'" class="flex justify-center py-20">
			<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
		</div>
		
		<div v-else-if="error" class="text-center py-20">
			<UIcon name="i-lucide-user-x" class="w-16 h-16 text-stone-300 mx-auto mb-4" />
			<h1 class="text-2xl font-bold mb-2">Benutzer nicht gefunden</h1>
			<p class="text-stone-500 mb-6 max-w-sm mx-auto">{{ error.message || 'Das angeforderte Profil existiert nicht oder ist nicht öffentlich zugänglich.' }}</p>
			<UButton to="/" color="neutral" variant="ghost" icon="i-lucide-arrow-left">Zurück zur Startseite</UButton>
		</div>

		<div v-else-if="profile" class="space-y-16">
			<!-- Header -->
			<div class="flex flex-col items-center text-center space-y-6">
				<UAvatar 
					:src="profile.photoURL" 
					:alt="profile.displayName" 
					size="xl" 
					class="w-32 h-32 ring-4 ring-primary/10 shadow-xl"
					:ui="{ 
						rounded: 'rounded-full',
						text: 'text-3xl font-black'
					}"
				/>
				<div>
					<h1 class="text-4xl font-black tracking-tight">{{ profile.displayName }}</h1>
					<p class="text-stone-500 mt-2">Mitglied des Lotissement Beausoleil</p>
				</div>
			</div>

		</div>
		</ClientOnly>
	</div>
</template>
