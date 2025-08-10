<template>
	<div
		class="flex flex-col text-neutral-800 w-fit mx-auto my-16 bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md gap-4">
		<div id="profile" class="flex gap-4 items-center">
			<img class="w-16 rounded-full" :src="user.photoUrl || '/placeholder/user-placeholder.svg'" alt="Profile image" />
			<div class="">
				<h3 class="text-sm leading-tight">
					{{ user.displayName || user.email }}
				</h3>
				<p class="text-xs text-neutral-400">{{ user.uid }}</p>
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
const user: Ref<any> = await useCurrentUser();
</script>
<style scoped></style>
