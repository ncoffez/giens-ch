<script setup lang="ts">
import type { MemoriamEntry } from "../../../types";
import { formatMemoriamPeriod } from "~/utils/memoriam";

definePageMeta({
	middleware: ["is-admin"],
	render: "client",
});

const { t } = useI18n();
const { waitForAuth, token } = useAuthReady();
const toast = useToast();

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const entries = ref<MemoriamEntry[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const pendingFiles = ref<File[]>([]);
const photoInput = ref<HTMLInputElement | null>(null);

const form = reactive({
	name: "",
	bio: "",
	periodFrom: "",
	periodTo: "",
	photos: [] as string[],
});

const isEditing = computed(() => !!editingId.value);
const formTitle = computed(() => isEditing.value ? t("admin.memoriam.edit") : t("admin.memoriam.create"));

const fetchEntries = async () => {
	try {
		await waitForAuth();
		loading.value = true;
		entries.value = await $fetch<MemoriamEntry[]>("/api/admin/memoriam", {
			headers: { Authorization: `Bearer ${token.value}` },
		});
	} catch (e: unknown) {
		toast.add({
			title: t("admin.memoriam.toasts.loadFailed"),
			description: getFetchError(e),
			color: "error",
		});
	} finally {
		loading.value = false;
	}
};

const resetForm = () => {
	editingId.value = null;
	form.name = "";
	form.bio = "";
	form.periodFrom = "";
	form.periodTo = "";
	form.photos = [];
	pendingFiles.value = [];
	if (photoInput.value) photoInput.value.value = "";
};

const openCreate = () => {
	resetForm();
	showForm.value = true;
};

const openEdit = (entry: MemoriamEntry) => {
	editingId.value = entry.id;
	form.name = entry.name;
	form.bio = entry.bioByLocale?.de || entry.bio || "";
	form.periodFrom = entry.periodFrom;
	form.periodTo = entry.periodTo;
	form.photos = [...entry.photos];
	pendingFiles.value = [];
	showForm.value = true;
};

const closeForm = () => {
	showForm.value = false;
	resetForm();
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = (event) => resolve(event.target?.result as string);
	reader.onerror = reject;
	reader.readAsDataURL(file);
});

const uploadPendingPhotos = async (entryId: string) => {
	const files = [...pendingFiles.value];
	pendingFiles.value = [];

	for (const file of files) {
		const dataUrl = await fileToDataUrl(file);
		await $fetch(`/api/admin/memoriam/${entryId}/photos/upload`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { file: dataUrl, type: file.type },
		});
	}
};

const saveEntry = async () => {
	const name = form.name.trim();
	if (!name) {
		toast.add({ title: t("admin.memoriam.toasts.nameRequired"), color: "warning" });
		return;
	}

	saving.value = true;
	try {
		await waitForAuth();
		let entryId = editingId.value;

		if (entryId) {
			await $fetch(`/api/admin/memoriam/${entryId}/update`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					name,
					bio: form.bio,
					periodFrom: form.periodFrom,
					periodTo: form.periodTo,
				},
			});
		} else {
			const created = await $fetch<MemoriamEntry>("/api/admin/memoriam", {
				method: "POST",
				headers: { Authorization: `Bearer ${token.value}` },
				body: {
					name,
					bio: form.bio,
					periodFrom: form.periodFrom,
					periodTo: form.periodTo,
				},
			});
			entryId = created.id;
		}

		if (pendingFiles.value.length && entryId) {
			await uploadPendingPhotos(entryId);
		}

		toast.add({
			title: isEditing.value ? t("admin.memoriam.toasts.saved") : t("admin.memoriam.toasts.created"),
			color: "success",
		});
		closeForm();
		await fetchEntries();
	} catch (e: unknown) {
		toast.add({
			title: t("admin.memoriam.toasts.saveFailed"),
			description: getFetchError(e),
			color: "error",
		});
	} finally {
		saving.value = false;
	}
};

const deleteEntry = async (entry: MemoriamEntry) => {
	if (!confirm(t("admin.memoriam.confirmDelete"))) return;

	try {
		await waitForAuth();
		await $fetch(`/api/admin/memoriam/${entry.id}/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
		});
		toast.add({ title: t("admin.memoriam.toasts.deleted"), color: "success" });
		if (editingId.value === entry.id) closeForm();
		await fetchEntries();
	} catch (e: unknown) {
		toast.add({
			title: t("admin.memoriam.toasts.deleteFailed"),
			description: getFetchError(e),
			color: "error",
		});
	}
};

const deletePhoto = async (photoUrl: string) => {
	if (!editingId.value) {
		form.photos = form.photos.filter((url) => url !== photoUrl);
		return;
	}

	try {
		await waitForAuth();
		await $fetch(`/api/admin/memoriam/${editingId.value}/photos/delete`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { photoUrl },
		});
		form.photos = form.photos.filter((url) => url !== photoUrl);
		toast.add({ title: t("admin.memoriam.toasts.photoDeleted"), color: "success" });
	} catch (e: unknown) {
		toast.add({
			title: t("admin.memoriam.toasts.saveFailed"),
			description: getFetchError(e),
			color: "error",
		});
	}
};

const onPhotosSelected = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = Array.from(target.files || []);
	if (!files.length) return;

	const currentCount = form.photos.length + pendingFiles.value.length;
	if (currentCount + files.length > MAX_PHOTOS) {
		toast.add({ title: t("admin.memoriam.toasts.maxPhotos", { count: MAX_PHOTOS }), color: "error" });
		target.value = "";
		return;
	}

	if (files.some((file) => !file.type.startsWith("image/"))) {
		toast.add({ title: t("admin.memoriam.toasts.imagesOnly"), color: "error" });
		target.value = "";
		return;
	}

	if (files.some((file) => file.size > MAX_FILE_SIZE)) {
		toast.add({ title: t("admin.memoriam.toasts.maxSize"), color: "error" });
		target.value = "";
		return;
	}

	pendingFiles.value = [...pendingFiles.value, ...files];
	target.value = "";
};

const removePendingFile = (index: number) => {
	pendingFiles.value = pendingFiles.value.filter((_, fileIndex) => fileIndex !== index);
};

onMounted(fetchEntries);
</script>

<template>
	<div class="max-w-screen-xl">
		<div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)] mb-3">
					{{ t("admin.memoriam.kicker") }}
				</p>
				<h1 class="display-copy text-4xl font-bold tracking-[-0.04em]">{{ t("admin.memoriam.title") }}</h1>
				<p class="app-muted mt-2">{{ t("admin.memoriam.lead") }}</p>
			</div>
			<UButton icon="i-lucide-plus" size="lg" @click="openCreate">
				{{ t("admin.memoriam.create") }}
			</UButton>
		</div>

		<div v-if="loading" class="flex justify-center py-12">
			<div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>

		<div
			v-else-if="!entries.length"
			class="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center dark:bg-stone-900/40"
		>
			<UIcon name="i-lucide-flower-2" class="w-12 h-12 mx-auto text-stone-400 mb-4" />
			<p class="font-semibold">{{ t("admin.memoriam.empty") }}</p>
			<p class="text-sm text-stone-500 mt-2">{{ t("admin.memoriam.emptyHint") }}</p>
		</div>

		<div v-else class="space-y-4">
			<div
				v-for="entry in entries"
				:key="entry.id"
				class="flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/90 p-4 sm:flex-row sm:items-center dark:border-stone-700 dark:bg-stone-800/70 md:rounded-[1.5rem] md:p-5"
			>
				<img
					v-if="entry.photos[0]"
					:src="entry.photos[0]"
					:alt="entry.name"
					class="h-24 w-24 shrink-0 rounded-2xl object-cover"
				>
				<div
					v-else
					class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-900"
				>
					<UIcon name="i-lucide-user" class="w-8 h-8 text-stone-300" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-xl font-bold">{{ entry.name }}</p>
					<p v-if="formatMemoriamPeriod(entry.periodFrom, entry.periodTo)" class="text-sm text-stone-500 mt-1">
						{{ formatMemoriamPeriod(entry.periodFrom, entry.periodTo) }}
					</p>
				</div>
				<div class="flex gap-2">
					<UButton color="neutral" variant="outline" icon="i-lucide-pencil" @click="openEdit(entry)">
						{{ t("admin.memoriam.edit") }}
					</UButton>
					<UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteEntry(entry)">
						{{ t("admin.memoriam.delete") }}
					</UButton>
				</div>
			</div>
		</div>

		<UModal
			v-model:open="showForm"
			:title="formTitle"
			:ui="{ content: 'sm:max-w-3xl' }"
		>
			<template #body>
				<div class="space-y-5">
					<UFormField :label="t('admin.memoriam.name')" required>
						<UInput
							v-model="form.name"
							size="lg"
							class="w-full"
							:placeholder="t('admin.memoriam.namePlaceholder')"
						/>
					</UFormField>

					<div class="grid gap-4 sm:grid-cols-2">
						<UFormField :label="t('admin.memoriam.periodFrom')" :description="t('admin.memoriam.periodHint')">
							<UInput v-model="form.periodFrom" size="lg" class="w-full" placeholder="1990" />
						</UFormField>
						<UFormField :label="t('admin.memoriam.periodTo')">
							<UInput v-model="form.periodTo" size="lg" class="w-full" placeholder="2010-06-15" />
						</UFormField>
					</div>

					<UFormField
						:label="t('admin.memoriam.photos')"
						:description="t('admin.memoriam.photosHint', { count: MAX_PHOTOS })"
					>
						<div class="flex flex-wrap gap-3">
							<div v-for="photo in form.photos" :key="photo" class="relative">
								<img :src="photo" alt="" class="h-24 w-24 rounded-xl object-cover">
								<UButton
									icon="i-lucide-x"
									color="error"
									size="xs"
									class="absolute -right-2 -top-2"
									@click="deletePhoto(photo)"
								/>
							</div>
							<div
								v-for="(file, index) in pendingFiles"
								:key="`${file.name}-${index}`"
								class="relative flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-stone-300 px-2 text-center text-xs text-stone-500"
							>
								<span class="line-clamp-3">{{ file.name }}</span>
								<UButton
									icon="i-lucide-x"
									color="neutral"
									variant="ghost"
									size="xs"
									class="absolute -right-2 -top-2"
									@click="removePendingFile(index)"
								/>
							</div>
						</div>
						<div class="mt-3">
							<input
								ref="photoInput"
								type="file"
								accept="image/*"
								multiple
								class="hidden"
								@change="onPhotosSelected"
							>
							<UButton
								color="neutral"
								variant="outline"
								icon="i-lucide-image-plus"
								@click="photoInput?.click()"
							>
								{{ t("admin.memoriam.addPhotos") }}
							</UButton>
						</div>
					</UFormField>

					<UFormField :label="t('admin.memoriam.bio')" :description="t('admin.memoriam.bioHint')">
						<ClientOnly>
							<TiptapLazyEditor v-model="form.bio" />
						</ClientOnly>
					</UFormField>
				</div>
			</template>

			<template #footer>
				<div class="flex w-full items-center justify-end gap-3">
					<UButton color="neutral" variant="ghost" :disabled="saving" @click="closeForm">
						{{ t("admin.memoriam.cancel") }}
					</UButton>
					<UButton icon="i-lucide-save" :loading="saving" @click="saveEntry">
						{{ t("admin.memoriam.save") }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
