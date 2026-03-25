import { onMounted } from "vue";

export async function useCurrentUser() {
	const { $ensureAuth, $currentUser } = useNuxtApp();

	onMounted(async () => {
		await $ensureAuth();
		console.assert(!!$currentUser, $currentUser.value);
	});

	return $currentUser;
}
