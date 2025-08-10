<script lang="ts" setup>
defineProps(["action"]);
</script>

<template>
	<button><slot></slot></button>
</template>

<style scoped>
.primary {
	@apply bg-blue-600 hover:bg-blue-700 text-neutral-50 rounded-md px-4 py-2 text-sm font-semibold my-2;
}

.subtle {
  @apply bg-transparent hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 rounded-md px-4 py-2 text-sm font-semibold my-2;
}
</style>
