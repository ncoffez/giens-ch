<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup>
const { unsubscribe } = useNuxtApp();
onUnmounted(() => unsubscribe());
</script>
