import type { Ref } from "vue";
import type { User } from "firebase/auth";

declare module "#app" {
	interface NuxtApp {
		$auth: import("firebase/auth").Auth;
		$currentUser: Ref<User | null>;
		$token: Ref<string | null>;
		$claims: Record<string, boolean>;
		$isAdmin: Ref<boolean>;
		$isPublisher: Ref<boolean>;
		$isOwner: Ref<boolean>;
		$isReader: Ref<boolean>;
		$authInitialized: Ref<boolean>;
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$auth: import("firebase/auth").Auth;
		$currentUser: Ref<User | null>;
		$token: Ref<string | null>;
		$claims: Record<string, boolean>;
		$isAdmin: Ref<boolean>;
		$isPublisher: Ref<boolean>;
		$isOwner: Ref<boolean>;
		$isReader: Ref<boolean>;
		$authInitialized: Ref<boolean>;
	}
}

export interface MiddlewareNuxtApp {
	$currentUser: Ref<User | null>;
	$token: Ref<string | null>;
	$claims: Record<string, boolean>;
	$isAdmin: Ref<boolean>;
	$isPublisher: Ref<boolean>;
	$isOwner: Ref<boolean>;
	$isReader: Ref<boolean>;
	$authInitialized: Ref<boolean>;
}

export {};
