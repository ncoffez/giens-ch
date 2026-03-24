<script setup lang="ts">
const localePath = useLocalePath();

onMounted(() => {
	navigateTo(localePath("/profile/me"));
});
</script>
<template>
	<div>Redirecting...</div>
</template>
