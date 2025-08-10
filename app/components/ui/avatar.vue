<script lang="ts" setup>
import { type User } from "firebase/auth";

const props = defineProps<{
	user: User;
}>();
</script>

<template>
	<img
		class="w-8 h-8 rounded-full m-0"
		:src="user.photoURL || '/placeholder/user-placeholder.svg'"
		:alt="user.displayName || 'Profile image'"
		:title="user.displayName || 'Profile image'" />
</template>

<style scoped></style>
