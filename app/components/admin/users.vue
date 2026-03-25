<script lang="ts" setup>
import type { AdminUser } from "../../../types";

const toast = useToast();
const localePath = useLocalePath();
const { checkAdminAccess, getAuthHeaders, isCheckingAuth, authError } = useAdminAuth();

const { data: users, status, refresh } = useAsyncData("admin-users-list", async () => {
	const hasAccess = await checkAdminAccess();
	if (!hasAccess) {
		return [];
	}
	
	try {
		const headers = await getAuthHeaders();
			const response = await $fetch<AdminUser[]>("/api/users", {
				headers
			});
			return response;
		} catch (e: unknown) {
			return [];
		}
}, {
	lazy: true,
	watch: [authError],
	immediate: true
});

const isModalOpen = ref(false);
const isRoleModalOpen = ref(false);
const isEditNameModalOpen = ref(false);
const isResetLinkModalOpen = ref(false);
const isPending = ref(false);
const selectedUserForRoles = ref<AdminUser | null>(null);
const selectedUserForEdit = ref<AdminUser | null>(null);
const editDisplayName = ref("");
const resetLink = ref("");
const resetLinkEmail = ref("");

const userRoles = ref({
	admin: false,
	publisher: false,
	owner: false,
	reader: false
});

const newUser = ref({
	email: "",
	password: "",
	displayName: ""
});

const columns = [
		{ id: "user", header: "Benutzer" },
		{ id: "roles", header: "Rollen" },
		{ accessorKey: "disabled", id: "status", header: "Status" },
		{ id: "actions", header: "" }
	];

	async function handleAction(action: string, user: AdminUser) {
	isPending.value = true;
	try {
		const headers = await getAuthHeaders();
		const response = await $fetch<{ success: boolean; link?: string }>("/api/admin/user-action", {
			method: "POST",
			headers,
			body: { 
				action, 
				uid: user?.uid, 
				email: user?.email,
				displayName: action === "update-name" ? editDisplayName.value : undefined,
				disabled: action === "toggle-status" ? !user.disabled : undefined,
				roles: action === "set-roles" ? userRoles.value : undefined
			}
		});

		if (response.success) {
			if (action === "reset-password" && response.link) {
				resetLink.value = response.link;
				resetLinkEmail.value = user?.email || "";
				isResetLinkModalOpen.value = true;
				await copyResetLink();
			} else {
				toast.add({
					title: "Erfolgreich",
					description: `Aktion '${action}' wurde ausgeführt.`,
					color: "success"
				});
			}
			isRoleModalOpen.value = false;
			isEditNameModalOpen.value = false;
			await refresh();
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
		toast.add({
			title: "Fehler",
			description: message,
			color: "error"
		});
	} finally {
		isPending.value = false;
	}
}

async function copyResetLink() {
	if (!import.meta.client || !resetLink.value) {
		return;
	}

	try {
		await navigator.clipboard.writeText(resetLink.value);
		toast.add({
			title: "Reset-Link kopiert",
			description: "Der Passwort-Reset-Link liegt jetzt in der Zwischenablage.",
			color: "success"
		});
	} catch {
		toast.add({
			title: "Reset-Link bereit",
			description: "Der Link konnte nicht automatisch kopiert werden und steht unten manuell bereit.",
			color: "warning"
		});
	}
}

async function addUser() {
	isPending.value = true;
	try {
		const headers = await getAuthHeaders();
		await $fetch("/api/admin/user-action", {
			method: "POST",
			headers,
			body: { action: "add", ...newUser.value }
		});
		toast.add({ title: "Erfolgreich", description: "Benutzer erstellt.", color: "success" });
		isModalOpen.value = false;
		newUser.value = { email: "", password: "", displayName: "" };
		await refresh();
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
		toast.add({ title: "Fehler", description: message, color: "error" });
	} finally {
		isPending.value = false;
	}
}

function openRoleModal(user: AdminUser) {
	selectedUserForRoles.value = user;
	const claims = user.customClaims || {};
	userRoles.value = {
		admin: !!claims.admin,
		publisher: !!claims.publisher,
		owner: !!claims.owner,
		reader: !!claims.reader
	};
	isRoleModalOpen.value = true;
}

function openEditNameModal(user: AdminUser) {
	selectedUserForEdit.value = user;
	editDisplayName.value = user.displayName || "";
	isEditNameModalOpen.value = true;
}

const getItems = (row: AdminUser) => [
	[
		{
			label: "Name bearbeiten",
			icon: "i-lucide-pencil",
			onSelect: () => openEditNameModal(row)
		},
		{
			label: "Rollen verwalten",
			icon: "i-lucide-shield-plus",
			onSelect: () => openRoleModal(row)
		},
		{
			label: "Passwort zurücksetzen",
			icon: "i-lucide-key-round",
			onSelect: () => handleAction("reset-password", row)
		},
		{
			label: "Öffentliches Profil",
			icon: "i-lucide-user-circle",
			onSelect: () => navigateTo(localePath(`/profile/${row.uid}`))
		},
		{
			label: row.disabled ? "Konto aktivieren" : "Konto deaktivieren",
			icon: row.disabled ? "i-lucide-user-check" : "i-lucide-user-x",
			onSelect: () => handleAction("toggle-status", row)
		}
	],
	[
		{
			label: "Löschen",
			icon: "i-lucide-trash-2",
			color: "error" as const,
			onSelect: () => {
				if (confirm("Benutzer wirklich löschen?")) {
					handleAction("delete", row);
				}
			}
		}
	]
];
</script>

<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-2">Benutzer</p>
				<h2 class="display-copy text-4xl font-bold tracking-[-0.04em]">Benutzerverwaltung</h2>
				<p class="app-muted mt-2">Rollen, Zugriff und Kommunikation zentral und nachvollziehbar pflegen.</p>
			</div>
			<UButton 
				icon="i-lucide-user-plus" 
				label="Benutzer einladen" 
				size="lg"
				@click="isModalOpen = true" />
		</div>

		<UiUserTableSkeleton v-if="status === 'pending'" />
		
		<div v-else-if="users && users.length === 0" class="px-4 py-10 text-center bg-stone-50/80 dark:bg-stone-900/60 rounded-2xl md:border md:border-dashed md:border-stone-200 md:dark:border-stone-800">
			<UIcon name="i-lucide-users" class="w-12 h-12 text-stone-300 mx-auto mb-4" />
			<p class="text-stone-500 font-medium">Keine Benutzer gefunden oder Zugriff verweigert.</p>
			<UButton label="Erneut versuchen" variant="ghost" class="mt-4" @click="refresh" />
		</div>
		
		<div v-else-if="users && users.length > 0" class="-mx-3 overflow-hidden md:mx-0 md:rounded-[1.75rem] md:border md:border-[var(--app-border)] md:bg-white/70 md:dark:bg-white/[0.03]">
			<UTable :data="users" :columns="columns" :ui="{ td: 'py-3 px-4', th: 'py-3 px-4 text-sm font-bold uppercase tracking-wider text-stone-500' }">
				<template #user-cell="{ row }">
					<div class="flex items-center gap-4">
						<UAvatar :src="row.original.photoURL" :alt="row.original.displayName || row.original.email" size="md" class="ring-2 ring-gray-50 dark:ring-gray-800" />
						<div class="flex flex-col">
							<NuxtLink :to="`/profile/${row.original.uid}`" class="text-md font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors">
								{{ row.original.displayName || "Kein Name" }}
							</NuxtLink>
							<span class="text-sm text-stone-500 font-medium">{{ row.original.email }}</span>
						</div>
					</div>
				</template>

				<template #roles-cell="{ row }">
					<div class="flex flex-wrap gap-1.5">
						<UBadge v-if="row.original.customClaims?.admin" color="neutral" variant="subtle" size="md" class="rounded-full px-3 py-1.5 font-medium">Admin</UBadge>
						<UBadge v-if="row.original.customClaims?.publisher" color="neutral" variant="subtle" size="md" class="rounded-full px-3 py-1.5 font-medium">Publisher</UBadge>
						<UBadge v-if="row.original.customClaims?.owner" color="neutral" variant="subtle" size="md" class="rounded-full px-3 py-1.5 font-medium">Besitzer</UBadge>
						<UBadge v-if="row.original.customClaims?.reader" color="neutral" variant="subtle" size="md" class="rounded-full px-3 py-1.5 font-medium">Leser</UBadge>
						<span v-if="!row.original.customClaims || Object.keys(row.original.customClaims).length === 0" class="text-xs text-stone-400 italic">Keine Rollen</span>
					</div>
				</template>

				<template #status-cell="{ row }">
					<UBadge 
						:color="row.original.disabled ? 'error' : 'success'" 
						variant="subtle" 
						size="md"
						class="capitalize font-bold px-3 py-1 rounded-full">
						{{ row.original.disabled ? "Deaktiviert" : "Aktiv" }}
					</UBadge>
				</template>

				<template #actions-cell="{ row }">
					<UDropdownMenu :items="getItems(row.original)">
						<UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" size="lg" />
					</UDropdownMenu>
				</template>
			</UTable>
		</div>

		<!-- Role Management Modal -->
		<UModal v-model:open="isRoleModalOpen" title="Rollen verwalten">
			<template #body>
				<div class="p-8 space-y-6">
					<div class="space-y-2">
						<h3 class="text-xl font-bold">Rollen verwalten</h3>
						<p class="text-sm text-stone-500">Passen Sie die Berechtigungen für <b>{{ selectedUserForRoles?.email }}</b> an.</p>
					</div>

					<div class="space-y-4">
						<div v-for="(val, role) in userRoles" :key="role" class="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
							<div class="flex flex-col">
								<span class="font-bold capitalize">{{ role }}</span>
								<span class="text-xs text-stone-500">
									{{ role === 'admin' ? 'Voller Zugriff auf alle Einstellungen' : 
									   role === 'publisher' ? 'Kann Artikel bearbeiten und veröffentlichen' :
									   role === 'owner' ? 'Zugriff auf Eigentümer-Dokumente' :
									   'Standard-Lesezugriff' }}
								</span>
							</div>
							<USwitch v-model="userRoles[role as keyof typeof userRoles]" size="lg" />
						</div>
					</div>

					<div class="flex justify-end gap-4 pt-6">
						<UButton color="neutral" variant="ghost" label="Abbrechen" size="lg" @click="isRoleModalOpen = false" />
						<UButton label="Speichern" size="lg" :loading="isPending" @click="handleAction('set-roles', selectedUserForRoles)" />
					</div>
				</div>
			</template>
		</UModal>

		<!-- Edit Name Modal -->
		<UModal v-model:open="isEditNameModalOpen" title="Benutzername ändern">
			<template #body>
				<div class="p-8 space-y-6">
					<div class="space-y-2">
						<h3 class="text-xl font-bold">Benutzername bearbeiten</h3>
						<p class="text-sm text-stone-500">Ändern Sie den Anzeigenamen für <b>{{ selectedUserForEdit?.email }}</b>.</p>
					</div>

					<UFormField label="Neuer Anzeigename" size="lg">
						<UInput 
							v-model="editDisplayName" 
							placeholder="Anzeigename" 
							class="w-full" 
							size="lg"
							@keyup.enter="handleAction('update-name', selectedUserForEdit)"
						/>
					</UFormField>

					<div class="flex justify-end gap-4 pt-6">
						<UButton color="neutral" variant="ghost" label="Abbrechen" size="lg" @click="isEditNameModalOpen = false" />
						<UButton label="Name speichern" size="lg" :loading="isPending" @click="handleAction('update-name', selectedUserForEdit)" />
					</div>
				</div>
			</template>
		</UModal>

		<UModal v-model:open="isResetLinkModalOpen" title="Passwort-Reset-Link">
			<template #body>
				<div class="p-8 space-y-6">
					<div class="space-y-2">
						<h3 class="text-xl font-bold">Reset-Link bereit</h3>
						<p class="text-sm text-stone-500">
							Der Link für <b>{{ resetLinkEmail }}</b> wurde generiert. Sie können ihn direkt kopieren und manuell zustellen.
						</p>
					</div>

					<UFormField label="Reset-Link" size="lg">
						<UTextarea
							:model-value="resetLink"
							:rows="5"
							readonly
							:autoresize="false"
							class="w-full font-mono text-xs"
						/>
					</UFormField>

					<div class="flex justify-end gap-4 pt-2">
						<UButton color="neutral" variant="ghost" label="Schliessen" size="lg" @click="isResetLinkModalOpen = false" />
						<UButton icon="i-lucide-copy" label="Link kopieren" size="lg" @click="copyResetLink" />
					</div>
				</div>
			</template>
		</UModal>

		<!-- Add User Modal -->
		<UModal v-model:open="isModalOpen" title="Neuen Benutzer hinzufügen">
			<template #body>
				<div class="p-8 space-y-6">
					<div class="space-y-2">
						<h3 class="text-xl font-bold">Neuen Benutzer hinzufügen</h3>
						<p class="text-sm text-stone-500">Geben Sie die Daten für den neuen Bewohner ein.</p>
					</div>
					<UFormField label="Anzeigename" size="lg">
						<UInput v-model="newUser.displayName" placeholder="Max Mustermann" class="w-full" size="lg" />
					</UFormField>
					<UFormField label="E-Mail" required size="lg">
						<UInput v-model="newUser.email" type="email" placeholder="max@beispiel.de" class="w-full" size="lg" />
					</UFormField>
					<UFormField label="Passwort" required size="lg">
						<UInput v-model="newUser.password" type="password" placeholder="••••••••" class="w-full" size="lg" />
					</UFormField>
					
					<div class="flex justify-end gap-4 pt-6">
						<UButton color="neutral" variant="ghost" label="Abbrechen" size="lg" @click="isModalOpen = false" />
						<UButton label="Benutzer erstellen" size="lg" :loading="isPending" @click="addUser" />
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>
