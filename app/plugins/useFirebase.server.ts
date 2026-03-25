import { computed, ref } from "vue";

const currentUser = ref(null);
const claims = ref<Record<string, any>>({});
const token = ref<string | null>(null);
const authInitialized = ref(true);
const isAuthInitializing = ref(false);

const isAdmin = computed(() => false);
const isPublisher = computed(() => false);
const isOwner = computed(() => false);
const isReader = computed(() => false);
const userPermission = computed(() => "public");

export default defineNuxtPlugin(() => {
	return {
		provide: {
			currentUser,
			claims,
			token,
			authInitialized,
			isAdmin,
			isPublisher,
			isOwner,
			isReader,
			userPermission,
			hasRole: () => false,
			ensureAuth: async () => {
				throw new Error("Firebase Auth is not available during server rendering.");
			},
			ensureFirestore: async () => {
				throw new Error("Firestore is not available during server rendering.");
			},
			ensureFunctions: async () => {
				throw new Error("Firebase Functions is not available during server rendering.");
			},
			getAuthToken: async () => null,
			signOut: async () => undefined,
			isAuthInitializing,
		},
	};
});
