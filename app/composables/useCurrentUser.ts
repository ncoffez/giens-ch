import type { Unsubscribe } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { onMounted } from "vue";

export async function useCurrentUser() {
	const { $auth } = useNuxtApp();
	const { $currentUser } = useNuxtApp();

	onMounted(async () => {
		await waitForAuthInit();
		$currentUser.value = $auth.currentUser;
		console.assert(!!$currentUser, $currentUser.value);
	});
	let unsubscribe: Unsubscribe;

	async function waitForAuthInit() {
		await new Promise<void>((resolve) => {
			unsubscribe = onAuthStateChanged($auth, (_) => resolve());
		});
	}

	onUnmounted(() => unsubscribe?.());

	return $currentUser;
}
