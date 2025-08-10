<template>
	<div>
		<h1>Users</h1>
		<UTable :data="users" class="my-4 w-full" />
	</div>
</template>

<script setup lang="ts">
import { type User } from "firebase/auth";

definePageMeta({ middleware: "is-admin" });
const roles = ref(["admin", "user", "guest"]);

const { data: users } = await useFetch<User[]>("/api/users");
</script>

<style scoped></style>
