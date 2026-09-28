<script setup lang="ts">
definePageMeta({
	middleware: ["site-permission"],
	permission: "admin.users.manage",
});
</script>

<template>
	<AdminUsers />
</template>
