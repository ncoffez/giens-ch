<script lang="ts" setup>
definePageMeta({ middleware: "is-logged-in" });
const { $currentUser } = useNuxtApp();

const logout = async () => {
	await logoutFromFirebase();
};

async function logoutFromFirebase() {
	const { $auth, $currentUser } = useNuxtApp();
	$currentUser.value = null;
	await $auth.signOut();
	reloadNuxtApp();
}

async function convertToAdmin() {
	const result = await $fetch("/api/user/setCustomClaim", {
		method: "POST",
		body: {
			uid: $currentUser.value.uid,
			role: "admin",
			requester: $currentUser.value,
		},
	});
}
</script>

<template>
	<div class="max-w-screen-xs mx-auto w-fit" v-if="$currentUser">
		<ClientOnly>
			<div class="flex flex-row gap-4 place-items-center">
				<UAvatar
					:src="$currentUser.photoURL"
					size="2xl"
					:alt="$currentUser?.displayName || $currentUser?.email"></UAvatar>
				<div class="flex flex-col my-4">
					<h4>{{ $currentUser.email }}</h4>
					<p>{{ $currentUser.displayName }}</p>
				</div>
			</div>
		</ClientOnly>
		<div class="flex gap-2">
			<UButton @click="convertToAdmin()">Toggle Admin</UButton>
			<UButton @click="logout()" loading-icon="true">Logout</UButton>
		</div>
	</div>
</template>

<style scoped></style>
