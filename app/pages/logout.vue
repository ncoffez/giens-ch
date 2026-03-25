<script lang="ts" setup>
const localePath = useLocalePath();

onMounted(async () => {
	await logoutFromFirebase();
	navigateTo(localePath("/"));
});
async function logoutFromFirebase() {
	const { $currentUser, $signOut } = useNuxtApp();
	$currentUser.value = null;
	await $signOut();
	return { message: "success", code: 200 };
}
</script>

<template><div>Logging out...</div></template>

<style scoped></style>
