<script lang="ts" setup>
const localePath = useLocalePath();

onMounted(async () => {
	await logoutFromFirebase();
	navigateTo(localePath("/"));
});
async function logoutFromFirebase() {
	const { $auth, $currentUser } = useNuxtApp();
	$currentUser.value = null;
	await $auth.signOut();
	return { message: "success", code: 200 };
}
</script>

<template><div>Logging out...</div></template>

<style scoped></style>
