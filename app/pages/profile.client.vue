<script lang="ts" setup>
definePageMeta({ middleware: "is-logged-in" });
const { $currentUser } = useNuxtApp();
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
		<div class="flex gap-2 place-content-center">
			<NuxtLink to="/logout"><UButton variant="ghost" loading-icon="true">Logout</UButton></NuxtLink>
		</div>
	</div>
</template>

<style scoped></style>
