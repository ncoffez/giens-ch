<script setup lang="ts">
import {
	DOCUMENT_ACTIONS,
	SITE_ROLES,
	type DocumentAction,
	type RoleGrants,
	type SiteRole,
} from "../../../shared/sitePermissions";
import {
	permissionFolderChangeIndex,
	permissionFolderPath,
	visiblePermissionFolders,
	type PermissionTreeRow,
} from "~/utils/permissionFolderTree";

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
	actions: Record<DocumentAction, FolderActionState>;
}

const { t, locale } = useI18n();
const { token, waitForAuth } = useAuthReady();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const rows = ref<PermissionRow[]>([]);
const folders = ref<FolderRow[]>([]);
const folderOverrides = ref<Record<string, Partial<Record<DocumentAction, RoleGrants>>>>({});
const expandedFolderIds = ref<Set<string>>(new Set());
const selectedFolderId = ref<string | null>(null);
const customizingFolderId = ref<string | null>(null);
const folderQuery = ref("");
const showRestoreDialog = ref(false);
const resetFoldersToo = ref(false);
const groupOrder = ["public", "documents", "home", "memoriam", "admin"];

const folderTree = computed(() => visiblePermissionFolders(
	folders.value,
	expandedFolderIds.value,
	locale.value,
	folderQuery.value,
));

const selectedFolder = computed(() =>
	folders.value.find((folder) => folder.id === selectedFolderId.value) || null,
);

const selectedAncestors = computed(() => {
	if (!selectedFolder.value) return [];
	return permissionFolderPath(folders.value, selectedFolder.value.id).slice(0, -1);
});

const changedActionsByFolder = computed(() => {
	const map = new Map<string, DocumentAction[]>();
	for (const [folderId, actions] of Object.entries(folderOverrides.value)) {
		const changed = DOCUMENT_ACTIONS.filter((action) => actions?.[action]);
		if (changed.length > 0) map.set(folderId, changed);
	}
	return map;
});

const folderChanges = computed(() => permissionFolderChangeIndex(
	folders.value,
	changedActionsByFolder.value,
	locale.value,
));

const groupedRows = computed(() => groupOrder
	.map((group) => ({
		group,
		rows: rows.value.filter((row) => row.group === group),
	}))
	.filter((group) => group.rows.length > 0));

const areaGroups = computed(() => groupedRows.value.filter((group) => group.group !== "documents"));
const documentRows = computed(() => groupedRows.value.find((group) => group.group === "documents")?.rows || []);

const showFolderEditor = computed(() => {
	if (!selectedFolder.value) return false;
	return folderHasOverride(selectedFolder.value) || customizingFolderId.value === selectedFolder.value.id;
});

function cloneGrants(grants: RoleGrants): RoleGrants {
	return {
		admin: !!grants.admin,
		publisher: !!grants.publisher,
		owner: !!grants.owner,
		reader: !!grants.reader,
	};
}

async function loadPermissions() {
	loading.value = true;
	error.value = "";
	try {
		await waitForAuth();
		const data = await $fetch<{
			rows: PermissionRow[];
			folders: FolderRow[];
		}>("/api/admin/permissions", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
		rows.value = (data.rows || []).map((row) => ({
			...row,
			grants: cloneGrants(row.grants),
		}));
		folders.value = data.folders || [];
		const alive = new Set(folders.value.map((folder) => folder.id));
		expandedFolderIds.value = new Set(Array.from(expandedFolderIds.value).filter((id) => alive.has(id)));
		if (selectedFolderId.value && !alive.has(selectedFolderId.value)) {
			selectedFolderId.value = null;
		}
		if (customizingFolderId.value && !alive.has(customizingFolderId.value)) {
			customizingFolderId.value = null;
		}
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

function baselineGrants(folder: FolderRow, action: DocumentAction): RoleGrants {
	const parent = folder.parentId
		? folders.value.find((item) => item.id === folder.parentId)
		: undefined;
	if (parent) return folderGrants(parent, action);
	const area = rows.value.find((row) => row.key === `documents.${action}`);
	if (area) return area.grants;
	return folder.actions[action].grants;
}

function actionChangeLabel(folder: FolderRow, action: DocumentAction): string {
	const current = folderGrants(folder, action);
	const baseline = baselineGrants(folder, action);
	const name = t(`admin.permissions.actions.${action}`);
	const parts = SITE_ROLES.flatMap((role) => {
		if (!!current[role] === !!baseline[role]) return [];
		const roleName = t(`admin.permissions.roles.${role}`);
		return [current[role] ? `${roleName} +` : `${roleName} −`];
	});
	return parts.length > 0 ? `${name} (${parts.join(", ")})` : name;
}

function ownChangeLabel(folderId: string): string {
	const folder = folders.value.find((item) => item.id === folderId);
	const actions = folderChanges.value.get(folderId)?.actions || [];
	if (!folder || actions.length === 0) return "";
	return actions.map((action) => actionChangeLabel(folder, action as DocumentAction)).join(", ");
}

function belowChangeLabel(folderId: string, expanded: boolean): string {
	const below = folderChanges.value.get(folderId)?.below || [];
	if (below.length === 0) return "";
	if (expanded) return t("admin.permissions.changedBelowShort");
	const shown = below.slice(0, 3).map((entry) => {
		const folder = folders.value.find((item) => item.id === entry.id);
		const actions = folder
			? entry.actions.map((action) => actionChangeLabel(folder, action as DocumentAction)).join(", ")
			: entry.actions.join(", ");
		return `${entry.name} (${actions})`;
	});
	const extra = below.length - shown.length;
	const changes = extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ");
	return t("admin.permissions.changedBelow", { changes });
}

function belowChangeDetail(folderId: string, action: string): string {
	const folder = folders.value.find((item) => item.id === folderId);
	if (!folder) return action;
	return actionChangeLabel(folder, action as DocumentAction);
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

function toggleExpanded(folderId: string) {
	const next = new Set(expandedFolderIds.value);
	if (next.has(folderId)) next.delete(folderId);
	else next.add(folderId);
	expandedFolderIds.value = next;
}

function selectFolder(folderId: string) {
	selectedFolderId.value = folderId;
	customizingFolderId.value = null;
	const next = new Set(expandedFolderIds.value);
	for (const folder of permissionFolderPath(folders.value, folderId)) {
		if (folder.id !== folderId) next.add(folder.id);
	}
	expandedFolderIds.value = next;
}

function onFolderKeydown(event: KeyboardEvent, node: PermissionTreeRow<FolderRow>) {
	if (folderQuery.value.trim()) return;
	if (event.key === "ArrowRight" && node.childCount > 0 && !node.expanded) {
		event.preventDefault();
		toggleExpanded(node.folder.id);
	}
	if (event.key === "ArrowLeft" && node.expanded) {
		event.preventDefault();
		toggleExpanded(node.folder.id);
	}
}

function startDeviation(folderId: string) {
	customizingFolderId.value = folderId;
}

function resetFolder(folderId: string) {
	const next = { ...folderOverrides.value };
	delete next[folderId];
	folderOverrides.value = next;
	if (customizingFolderId.value === folderId) customizingFolderId.value = null;
}

function openRestoreDialog() {
	resetFoldersToo.value = false;
	showRestoreDialog.value = true;
}

async function restoreFactoryDefaults() {
	const clearFolders = resetFoldersToo.value;
	showRestoreDialog.value = false;
	saving.value = true;
	try {
		await $fetch("/api/admin/permissions", {
			method: "PUT",
			headers: { Authorization: `Bearer ${token.value}` },
			body: {
				grants: {},
				folders: clearFolders ? {} : folderOverrides.value,
			},
		});
		customizingFolderId.value = null;
		toast.add({ title: t("admin.permissions.resetStandardDone"), color: "success" });
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
			<div class="flex flex-wrap gap-2">
				<UButton
					color="error"
					variant="outline"
					icon="i-lucide-rotate-ccw"
					:disabled="loading || saving"
					@click="openRestoreDialog"
				>
					{{ t("admin.permissions.resetStandard") }}
				</UButton>
				<UButton icon="i-lucide-save" :loading="saving" :disabled="loading" @click="savePermissions">
					{{ t("admin.permissions.save") }}
				</UButton>
			</div>
		</div>

		<div v-if="loading" class="py-16 text-center text-stone-500">{{ t("documents.states.loading") }}</div>
		<div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{{ error }}</div>

		<template v-else>
			<section v-for="group in areaGroups" :key="group.group" class="space-y-3">
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
				<div v-if="documentRows.length" class="space-y-2">
					<div>
						<h3 class="font-semibold">{{ t("admin.permissions.defaultTitle") }}</h3>
						<p class="app-muted mt-1 text-sm max-w-3xl">{{ t("admin.permissions.defaultLead") }}</p>
					</div>
					<div class="overflow-x-auto rounded-2xl border border-[var(--app-border)]">
						<table class="min-w-[720px] w-full text-sm">
							<thead class="bg-stone-50 text-left dark:bg-stone-900/60">
								<tr>
									<th class="px-4 py-3 font-semibold">{{ t("admin.permissions.actionColumn") }}</th>
									<th v-for="role in SITE_ROLES" :key="role" class="px-3 py-3 font-semibold">{{ t(`admin.permissions.roles.${role}`) }}</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="row in documentRows" :key="row.key" class="border-t border-[var(--app-border)]">
									<td class="px-4 py-3 font-medium">{{ t(`admin.permissions.rows.${row.key}`) }}</td>
									<td v-for="role in SITE_ROLES" :key="role" class="px-3 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 cursor-pointer accent-[var(--app-primary)]"
											:checked="row.grants[role]"
											:aria-label="`${t(`admin.permissions.rows.${row.key}`)} ${t(`admin.permissions.roles.${role}`)}`"
											@change="toggleRow(row, role)"
										>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<p v-if="!folders.length" class="rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
					{{ t("admin.permissions.foldersEmpty") }}
				</p>
				<div v-else class="grid items-start gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
					<div class="rounded-2xl border border-[var(--app-border)] p-3">
						<label class="sr-only" for="permission-folder-query">{{ t("admin.permissions.searchFolders") }}</label>
						<UInput
							id="permission-folder-query"
							v-model="folderQuery"
							icon="i-lucide-search"
							size="sm"
							:placeholder="t('admin.permissions.searchFolders')"
							class="mb-3"
						/>
						<p v-if="!folderTree.length" class="px-2 py-6 text-sm text-stone-500">
							{{ t("admin.permissions.noFolderMatches") }}
						</p>
						<ul
							v-else
							role="tree"
							:aria-label="t('admin.permissions.folderTree')"
							class="max-h-[32rem] space-y-0.5 overflow-y-auto"
						>
							<li
								v-for="node in folderTree"
								:key="node.folder.id"
								role="treeitem"
								:aria-level="node.depth + 1"
								:aria-selected="selectedFolderId === node.folder.id"
								:aria-expanded="node.childCount > 0 ? node.expanded : undefined"
							>
								<div
									class="flex items-center gap-0.5 rounded-lg pr-2"
									:class="selectedFolderId === node.folder.id ? 'bg-stone-100 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-900/60'"
									:style="{ paddingLeft: `${Math.min(node.depth, 8) * 0.85}rem` }"
								>
									<button
										v-if="node.childCount > 0 && !folderQuery.trim()"
										type="button"
										class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-700"
										:aria-label="node.expanded ? t('admin.permissions.collapseFolder', { name: node.folder.name }) : t('admin.permissions.expandFolder', { name: node.folder.name })"
										@click="toggleExpanded(node.folder.id)"
									>
										<UIcon :name="node.expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="h-4 w-4" />
									</button>
									<span v-else-if="node.childCount > 0" class="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
										<UIcon :name="node.expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="h-4 w-4" />
									</span>
									<span v-else class="h-8 w-8 shrink-0" />
									<button
										type="button"
										class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-left text-sm"
										@click="selectFolder(node.folder.id)"
										@keydown="onFolderKeydown($event, node)"
									>
										<UIcon :name="node.expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'" class="h-4 w-4 shrink-0 text-stone-400" />
										<span class="min-w-0 flex-1">
											<span class="flex items-baseline gap-2">
												<span class="truncate font-medium">{{ node.folder.name }}</span>
												<span v-if="!node.expanded && node.childCount > 0" class="shrink-0 text-xs text-stone-400">{{ node.childCount }}</span>
											</span>
											<span class="mt-0.5 block text-xs leading-4">
												<span v-if="ownChangeLabel(node.folder.id)" class="text-[var(--app-primary)]">{{ ownChangeLabel(node.folder.id) }}</span>
												<span v-else class="text-stone-400">{{ t("admin.permissions.defaultBadge") }}</span>
												<span v-if="belowChangeLabel(node.folder.id, node.expanded)" class="text-amber-800 dark:text-amber-200">
													<template v-if="ownChangeLabel(node.folder.id)"> · </template>
													{{ belowChangeLabel(node.folder.id, node.expanded) }}
												</span>
											</span>
										</span>
									</button>
								</div>
							</li>
						</ul>
					</div>

					<article v-if="selectedFolder" class="rounded-2xl border border-[var(--app-border)] p-4">
						<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
							<div class="min-w-0">
								<p v-if="selectedAncestors.length" class="mb-1 flex flex-wrap items-center gap-1 text-xs text-stone-500">
									<template v-for="(ancestor, index) in selectedAncestors" :key="ancestor.id">
										<button type="button" class="cursor-pointer hover:text-[var(--app-primary)]" @click="selectFolder(ancestor.id)">
											{{ ancestor.name }}
										</button>
										<UIcon v-if="index < selectedAncestors.length - 1" name="i-lucide-chevron-right" class="h-3 w-3" />
									</template>
								</p>
								<h3 class="font-semibold">{{ selectedFolder.name }}</h3>
								<p class="text-xs text-stone-500">{{ folderHasOverride(selectedFolder) ? t("admin.permissions.custom") : t("admin.permissions.usesDefault") }}</p>
							</div>
							<UButton
								v-if="folderHasOverride(selectedFolder)"
								size="sm"
								color="neutral"
								variant="ghost"
								@click="resetFolder(selectedFolder.id)"
							>
								{{ t("admin.permissions.resetFolder") }}
							</UButton>
						</div>
						<div v-if="!showFolderEditor" class="space-y-3">
							<p class="text-sm text-stone-500">{{ t("admin.permissions.deviateHint") }}</p>
							<UButton size="sm" color="neutral" variant="soft" icon="i-lucide-split" @click="startDeviation(selectedFolder.id)">
								{{ t("admin.permissions.deviate") }}
							</UButton>
						</div>
						<div v-else class="overflow-x-auto">
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
											<span v-if="folderIsExplicit(selectedFolder, action)" class="ml-2 text-xs text-stone-400">{{ t("admin.permissions.custom") }}</span>
										</td>
										<td v-for="role in SITE_ROLES" :key="role" class="px-3 py-2">
											<input
												type="checkbox"
												class="h-4 w-4 cursor-pointer accent-[var(--app-primary)]"
												:checked="folderGrants(selectedFolder, action)[role]"
												:aria-label="`${selectedFolder.name} ${t(`admin.permissions.actions.${action}`)} ${t(`admin.permissions.roles.${role}`)}`"
												@change="toggleFolder(selectedFolder, action, role)"
											>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div v-if="folderChanges.get(selectedFolder.id)?.below.length" class="mt-4 border-t border-[var(--app-border)] pt-3">
							<h4 class="text-sm font-semibold">{{ t("admin.permissions.changedBelowTitle") }}</h4>
							<ul class="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
								<li v-for="entry in folderChanges.get(selectedFolder.id)?.below || []" :key="entry.id" class="flex flex-wrap items-baseline gap-x-2">
									<button type="button" class="cursor-pointer font-medium hover:text-[var(--app-primary)]" @click="selectFolder(entry.id)">
										{{ entry.name }}
									</button>
									<span class="text-xs text-[var(--app-primary)]">{{ entry.actions.map((action) => belowChangeDetail(entry.id, action)).join(", ") }}</span>
								</li>
							</ul>
						</div>
					</article>
					<p v-else class="rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
						{{ t("admin.permissions.selectFolder") }}
					</p>
				</div>
			</section>
		</template>

		<UModal
			v-model:open="showRestoreDialog"
			:title="t('admin.permissions.resetStandard')"
			:ui="{ content: 'sm:max-w-lg' }"
		>
			<template #body>
				<div class="space-y-4">
					<p class="text-sm text-stone-600 dark:text-stone-300">{{ t("admin.permissions.resetStandardConfirm") }}</p>
					<label for="reset-folder-permissions" class="flex cursor-pointer items-start gap-3 text-sm">
						<input
							id="reset-folder-permissions"
							v-model="resetFoldersToo"
							type="checkbox"
							class="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--app-primary)]"
						>
						<span>
							<span class="font-medium">{{ t("admin.permissions.resetFoldersToo") }}</span>
							<span class="mt-1 block text-stone-500">{{ t("admin.permissions.resetFoldersTooHint") }}</span>
						</span>
					</label>
				</div>
			</template>
			<template #footer>
				<div class="flex w-full items-center justify-end gap-3">
					<UButton color="neutral" variant="ghost" @click="showRestoreDialog = false">
						{{ t("admin.permissions.resetStandardCancel") }}
					</UButton>
					<UButton color="error" icon="i-lucide-rotate-ccw" :loading="saving" @click="restoreFactoryDefaults">
						{{ t("admin.permissions.resetStandardApply") }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
