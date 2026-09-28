<script setup lang="ts">
// Stable redirect for nested parent
const localePath = useLocalePath();

definePageMeta({
	middleware: [
		async function (to) {
			if (import.meta.server) return;
			const path = to.path.replace(/\/$/, "") || "/";
			if (path !== "/admin" && path !== "/fr/admin") return;

			const localePath = useLocalePath();
			const { can, refresh } = useSitePermissions();
			try {
				await refresh();
			} catch {
				return navigateTo(localePath("/"));
			}

			const destinations = [
				["admin.users.manage", "/admin/users"],
				["admin.permissions.manage", "/admin/permissions"],
				["admin.homes.manage", "/admin/homes"],
				["memoriam.manage", "/admin/memoriam"],
				["admin.trash.manage", "/admin/trash"],
				["admin.settings.manage", "/admin/settings"],
			] as const;
			const match = destinations.find(([key]) => can(key));
			return navigateTo(localePath(match?.[1] || "/"));
		},
	],
});
</script>
<template>
	<div></div>
</template>
