<script setup lang="ts">
import {
	DOCUMENT_ACTIONS,
	SITE_ROLES,
	type DocumentAction,
	type RoleGrants,
	type SiteRole,
} from "../../../shared/sitePermissions";

definePageMeta({
	middleware: ["site-permission"],
	permission: "admin.permissions.manage",
});

interface PermissionRow {
	key: string;
	group: string;
	locked: boolean;
	grants: RoleGrants;
}

interface FolderActionState {
	grants: RoleGrants;
	explicit: boolean;
}

interface FolderRow {
	id: string;
	name: string;
	parentId: string | null;
	depth: number;
	actions: Record<DocumentAction, FolderActionState>;
}

const { t } = useI18n();
const { token, waitForAuth } = useAuthReady();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const rows = ref<PermissionRow[]>([]);
const folders = ref<FolderRow[]>([]);
const folderOverrides = ref<Record<string, Partial<Record<DocumentAction, RoleGrants>>>>({});
const groupOrder = ["public", "documents", "home", "memoriam", "admin"];

const groupedRows = computed(() => groupOrder
	.map((group) => ({
		group,
		rows: rows.value.filter((row) => row.group === group),
	}))
	.filter((group) => group.rows.length > 0));

function cloneGrants(grants: RoleGrants): RoleGrants {
	return {
		admin: !!grants.admin,
		publisher: !!grants.publisher,
		owner: !!grants.owner,
		reader: !!grants.reader,
	};
}

function folderDepth(foldersById: Map<string, { parentId: string | null }>, id: string): number {
	let depth = 0;
	let current = foldersById.get(id)?.parentId || null;
	const seen = new Set<string>([id]);
	while (current) {
		if (seen.has(current)) break;
		seen.add(current);
		depth += 1;
		current = foldersById.get(current)?.parentId || null;
	}
	return depth;
}

async function loadPermissions() {
	loading.value = true;
	error.value = "";
	try {
		await waitForAuth();
		const data = await $fetch<{
			rows: PermissionRow[];
			folders: Array<Omit<FolderRow, "depth">>;
		}>("/api/admin/permissions", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		rows.value = (data.rows || []).map((row) => ({
			...row,
			grants: cloneGrants(row.grants),
		}));
		const byId = new Map((data.folders || []).map((folder) => [folder.id, folder]));
		folders.value = (data.folders || [])
			.map((folder) => ({
				...folder,
				depth: folderDepth(byId, folder.id),
			}))
			.sort((left, right) => left.name.localeCompare(right.name, "de"));
		const overrides: Record<string, Partial<Record<DocumentAction, RoleGrants>>> = {};
		for (const folder of data.folders || []) {
			for (const action of DOCUMENT_ACTIONS) {
				const state = folder.actions?.[action];
				if (!state?.explicit) continue;
				const current = overrides[folder.id] || {};
				current[action] = cloneGrants(state.grants);
				overrides[folder.id] = current;
			}
		}
		folderOverrides.value = overrides;
	} catch (cause: unknown) {
		error.value = getFetchError(cause) || t("admin.permissions.loadFailed");
	} finally {
		loading.value = false;
	}
}

function toggleRow(row: PermissionRow, role: SiteRole) {
	if (row.locked) return;
	row.grants[role] = !row.grants[role];
}

function folderGrants(folder: FolderRow, action: DocumentAction): RoleGrants {
	return folderOverrides.value[folder.id]?.[action] || folder.actions[action].grants;
}

function folderIsExplicit(folder: FolderRow, action: DocumentAction) {
	return !!folderOverrides.value[folder.id]?.[action];
}

function folderHasOverride(folder: FolderRow) {
	const override = folderOverrides.value[folder.id];
	return !!override && Object.keys(override).length > 0;
}

function toggleFolder(folder: FolderRow, action: DocumentAction, role: SiteRole) {
	const current = cloneGrants(folderGrants(folder, action));
	current[role] = !current[role];
	folderOverrides.value = {
		...folderOverrides.value,
		[folder.id]: {
			...(folderOverrides.value[folder.id] || {}),
			[action]: current,
		},
	};
}

function resetFolder(folderId: string) {
	const next = { ...folderOverrides.value };
	delete next[folderId];
	folderOverrides.value = next;
}

async function savePermissions() {
	saving.value = true;
	try {
		await $fetch("/api/admin/permissions", {
			method: "PUT",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				grants: Object.fromEntries(rows.value
					.filter((row) => !row.locked)
					.map((row) => [row.key, row.grants])),
				folders: folderOverrides.value,
			},
		});
		toast.add({ title: t("admin.permissions.saved"), color: "success" });
		await loadPermissions();
	} catch (cause: unknown) {
		toast.add({
			title: t("admin.permissions.saveFailed"),
			description: getFetchError(cause),
			color: "error",
		});
	} finally {
		saving.value = false;
	}
}

onMounted(loadPermissions);
</script>

<template>
	<div class="space-y-8">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-2">{{ t("admin.permissions.kicker") }}</p>
				<h1 class="display-copy text-3xl font-bold tracking-[-0.04em]">{{ t("admin.permissions.title") }}</h1>
				<p class="app-muted mt-2 max-w-3xl">{{ t("admin.permissions.lead") }}</p>
			</div>
			<UButton icon="i-lucide-save" :loading="saving" :disabled="loading" @click="savePermissions">
				{{ t("admin.permissions.save") }}
			</UButton>
		</div>

		<div v-if="loading" class="py-16 text-center text-stone-500">{{ t("documents.states.loading") }}</div>
		<div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{{ error }}</div>

		<template v-else>
			<section v-for="group in groupedRows" :key="group.group" class="space-y-3">
				<h2 class="text-lg font-bold">{{ t(`admin.permissions.groups.${group.group}`) }}</h2>
				<div class="overflow-x-auto rounded-2xl border border-[var(--app-border)]">
					<table class="min-w-[720px] w-full text-sm">
						<thead class="bg-stone-50 text-left dark:bg-stone-900/60">
							<tr>
								<th class="px-4 py-3 font-semibold">{{ t("admin.permissions.title") }}</th>
								<th v-for="role in SITE_ROLES" :key="role" class="px-3 py-3 font-semibold">{{ t(`admin.permissions.roles.${role}`) }}</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="row in group.rows" :key="row.key" class="border-t border-[var(--app-border)]">
								<td class="px-4 py-3">
									<div class="font-medium">{{ t(`admin.permissions.rows.${row.key}`) }}</div>
									<p v-if="row.locked" class="text-xs text-stone-500">{{ t("admin.permissions.locked") }}</p>
								</td>
								<td v-for="role in SITE_ROLES" :key="role" class="px-3 py-3">
									<input
										type="checkbox"
										class="h-4 w-4 accent-[var(--app-primary)]"
										:checked="row.grants[role]"
										:disabled="row.locked"
										:aria-label="`${t(`admin.permissions.rows.${row.key}`)} ${t(`admin.permissions.roles.${role}`)}`"
										@change="toggleRow(row, role)"
									>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section class="space-y-3">
				<div>
					<h2 class="text-lg font-bold">{{ t("admin.permissions.foldersTitle") }}</h2>
					<p class="app-muted mt-1 text-sm max-w-3xl">{{ t("admin.permissions.foldersHint") }}</p>
				</div>
				<p v-if="!folders.length" class="rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
					{{ t("admin.permissions.foldersEmpty") }}
				</p>
				<div v-else class="space-y-4">
					<article v-for="folder in folders" :key="folder.id" class="rounded-2xl border border-[var(--app-border)] p-4" :style="{ marginLeft: `${Math.min(folder.depth, 4) * 12}px` }">
						<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 class="font-semibold">{{ folder.name }}</h3>
								<p class="text-xs text-stone-500">{{ folderHasOverride(folder) ? t("admin.permissions.custom") : t("admin.permissions.inherited") }}</p>
							</div>
							<UButton
								v-if="folderHasOverride(folder)"
								size="sm"
								color="neutral"
								variant="ghost"
								@click="resetFolder(folder.id)"
							>
								{{ t("admin.permissions.resetFolder") }}
							</UButton>
						</div>
						<div class="overflow-x-auto">
							<table class="min-w-[680px] w-full text-sm">
								<thead>
									<tr class="text-left text-stone-500">
										<th class="py-2 pr-3 font-medium" />
										<th v-for="role in SITE_ROLES" :key="role" class="px-3 py-2 font-medium">{{ t(`admin.permissions.roles.${role}`) }}</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="action in DOCUMENT_ACTIONS" :key="action">
										<td class="py-2 pr-3">
											{{ t(`admin.permissions.actions.${action}`) }}
											<span v-if="folderIsExplicit(folder, action)" class="ml-2 text-xs text-stone-400">{{ t("admin.permissions.custom") }}</span>
										</td>
										<td v-for="role in SITE_ROLES" :key="role" class="px-3 py-2">
											<input
												type="checkbox"
												class="h-4 w-4 accent-[var(--app-primary)]"
												:checked="folderGrants(folder, action)[role]"
												:aria-label="`${folder.name} ${t(`admin.permissions.actions.${action}`)} ${t(`admin.permissions.roles.${role}`)}`"
												@change="toggleFolder(folder, action, role)"
											>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</article>
				</div>
			</section>
		</template>
	</div>
</template>
