import type { Ref } from "vue";
import type { Auth, User } from "firebase/auth";

declare module "#app" {
	interface NuxtApp {
		$currentUser: Ref<User | null>;
		$token: Ref<string | null>;
		$claims: Ref<Record<string, any>>;
		$isAdmin: Ref<boolean>;
		$isPublisher: Ref<boolean>;
		$isOwner: Ref<boolean>;
		$isReader: Ref<boolean>;
		$authInitialized: Ref<boolean>;
		$isAuthInitializing: Ref<boolean>;
		$ensureAuth: () => Promise<Auth>;
		$getAuthToken: (forceRefresh?: boolean) => Promise<string | null>;
		$signOut: () => Promise<void>;
		$hasRole: (role: string) => boolean;
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$currentUser: Ref<User | null>;
		$token: Ref<string | null>;
		$claims: Ref<Record<string, any>>;
		$isAdmin: Ref<boolean>;
		$isPublisher: Ref<boolean>;
		$isOwner: Ref<boolean>;
		$isReader: Ref<boolean>;
		$authInitialized: Ref<boolean>;
		$isAuthInitializing: Ref<boolean>;
		$ensureAuth: () => Promise<Auth>;
		$getAuthToken: (forceRefresh?: boolean) => Promise<string | null>;
		$signOut: () => Promise<void>;
		$hasRole: (role: string) => boolean;
	}
}

export interface MiddlewareNuxtApp {
	$currentUser: Ref<User | null>;
	$token: Ref<string | null>;
	$claims: Ref<Record<string, any>>;
	$isAdmin: Ref<boolean>;
	$isPublisher: Ref<boolean>;
	$isOwner: Ref<boolean>;
	$isReader: Ref<boolean>;
	$authInitialized: Ref<boolean>;
	$ensureAuth: () => Promise<Auth>;
}

export {};
