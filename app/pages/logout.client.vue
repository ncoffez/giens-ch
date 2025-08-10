<script lang="ts" setup>
onMounted(async () => {
	await logoutFromFirebase();
	navigateTo("/");
});
async function logoutFromFirebase() {
	const { $auth, $currentUser } = useNuxtApp();
	$currentUser.value = null;
	await $auth.signOut();
	return { message: "success", code: 200 };
}
</script>

<template></template>

<style scoped></style>
