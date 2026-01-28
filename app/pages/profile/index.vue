<script setup lang="ts">
const { $currentUser } = useNuxtApp();

await new Promise(resolve => setTimeout(resolve, 100));

if ($currentUser?.value) {
	navigateTo('/profile/me');
} else {
	navigateTo('/login');
}
</script>