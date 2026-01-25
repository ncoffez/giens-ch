<script lang="ts" setup>
import { watch } from 'vue';

const toast = useToast();
const { data: users, status, refresh } = useFetch<any[]>("/api/users", {
	lazy: true
});

watch(users, (newUsers) => {
	console.log("AdminUsers: fetched users", newUsers);
}, { immediate: true });

const isModalOpen = ref(false);
const isPending = ref(false);

const newUser = ref({
	email: "",
	password: "",
	displayName: ""
});

const columns = [
	{ id: "user", header: "Benutzer" },
	{ accessorKey: "disabled", id: "status", header: "Status" },
	{ accessorKey: "uid", header: "UID" },
	{ id: "actions", header: "" }
];

async function handleAction(action: string, user: any) {
	isPending.value = true;
	try {
		const response = await $fetch("/api/admin/user-action", {
			method: "POST",
			body: { 
				action, 
				uid: user?.uid, 
				email: user?.email,
				disabled: action === "toggle-status" ? !user.disabled : undefined
			}
		});

		if (response.success) {
			toast.add({
				title: "Erfolgreich",
				description: `Aktion '${action}' wurde ausgeführt.`,
				color: "success"
			});
			if (action === "reset-password" && response.link) {
				// Optionally show the link or just say email was sent (if we had a sender)
				console.log("Reset link:", response.link);
			}
			await refresh();
		}
	} catch (error: any) {
		toast.add({
			title: "Fehler",
			description: error.message,
			color: "error"
		});
	} finally {
		isPending.value = false;
	}
}

async function addUser() {
	isPending.value = true;
	try {
		await $fetch("/api/admin/user-action", {
			method: "POST",
			body: { action: "add", ...newUser.value }
		});
		toast.add({ title: "Erfolgreich", description: "Benutzer erstellt.", color: "success" });
		isModalOpen.value = false;
		newUser.value = { email: "", password: "", displayName: "" };
		await refresh();
	} catch (error: any) {
		toast.add({ title: "Fehler", description: error.message, color: "error" });
	} finally {
		isPending.value = false;
	}
}

const getItems = (row: any) => [
	[
		{
			label: "Passwort zurücksetzen",
			icon: "i-lucide-key-round",
			onSelect: () => handleAction("reset-password", row)
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
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-extrabold tracking-tight">Benutzerverwaltung</h2>
			<UButton 
				icon="i-lucide-user-plus" 
				label="Benutzer einladen" 
				size="lg"
				@click="isModalOpen = true" />
		</div>

		<UiUserTableSkeleton v-if="status === 'pending'" />
		
		<UCard v-else :ui="{ body: { padding: 'p-0' } }" class="overflow-hidden rounded-2xl shadow-lg border-gray-100 dark:border-gray-800">
			<UTable :data="users || []" :columns="columns" :ui="{ td: 'py-5 px-4', th: 'py-4 px-4 text-sm font-bold uppercase tracking-wider text-gray-500' }">
				<template #user-cell="{ row }">
					<div class="flex items-center gap-4">
						<UAvatar :src="row.original.photoURL" :alt="row.original.displayName || row.original.email" size="md" class="ring-2 ring-gray-50 dark:ring-gray-800" />
						<div class="flex flex-col">
							<span class="text-lg font-bold text-gray-900 dark:text-white">{{ row.original.displayName || 'Kein Name' }}</span>
							<span class="text-sm text-gray-500 font-medium">{{ row.original.email }}</span>
						</div>
					</div>
				</template>

				<template #status-cell="{ row }">
					<UBadge 
						:color="row.original.disabled ? 'error' : 'success'" 
						variant="subtle" 
						size="md"
						class="capitalize font-bold px-3 py-1 rounded-full">
						{{ row.original.disabled ? 'Deaktiviert' : 'Aktiv' }}
					</UBadge>
				</template>

				<template #uid-cell="{ row }">
					<span class="text-xs text-gray-400 font-medium tracking-tight">{{ row.original.uid }}</span>
				</template>

				<template #actions-cell="{ row }">
					<UDropdownMenu :items="getItems(row.original)">
						<UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" size="lg" />
					</UDropdownMenu>
				</template>
			</UTable>
		</UCard>

		<!-- Add User Modal -->
		<UModal v-model:open="isModalOpen" title="Neuen Benutzer hinzufügen">
			<template #body>
				<div class="p-8 space-y-6">
					<div class="space-y-2">
						<h3 class="text-xl font-bold">Neuen Benutzer hinzufügen</h3>
						<p class="text-sm text-gray-500">Geben Sie die Daten für den neuen Bewohner ein.</p>
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
