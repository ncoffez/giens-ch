<script setup lang="ts">
const props = defineProps<{ home: any }>();

const { $token, $currentUser, $isAdmin } = useNuxtApp();
const toast = useToast();

const editors = ref<any[]>([]);
const loading = ref(false);
const editorEmail = ref("");
const daysToExpire = ref(7);
const shareUrl = ref<string | null>(null);
const shareCreated = ref<any | null>(null);

const fetchEditors = async () => {
	// In a real implementation, you'd need an API to fetch user details
	// For now, we'll just show UIDs
	editors.value = (props.home?.editors || []).map((uid: string) => ({ uid }));
};

const addEditor = async () => {
	if (!editorEmail.value) return;

	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}/editors.add`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { email: editorEmail.value },
		});
		toast.add({ title: "Editor added successfully", color: "green" });
		editorEmail.value = "";
		fetchEditors();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to add editor", color: "red" });
	} finally {
		loading.value = false;
	}
};

const removeEditor = async (editorUid: string) => {
	if (!confirm("Remove this editor?")) return;

	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}/editors.remove`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { editorUid },
		});
		toast.add({ title: "Editor removed", color: "green" });
		fetchEditors();
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to remove editor", color: "red" });
	} finally {
		loading.value = false;
	}
};

const generateShareLink = async () => {
	try {
		loading.value = true;
		const result = await $fetch(`/api/homes/${props.home.id}/share.create`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: { daysToExpire: daysToExpire.value },
		});
		shareUrl.value = result.shareUrl;
		shareCreated.value = result;
		toast.add({ title: "Share link generated!", color: "green" });
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to generate share link", color: "red" });
	} finally {
		loading.value = false;
	}
};

const copyShareLink = () => {
	if (!shareUrl.value) return;
	navigator.clipboard.writeText(shareUrl.value);
	toast.add({ title: "Link copied to clipboard", color: "green" });
};

onMounted(fetchEditors);
</script>

<template>
	<div class="space-y-6">
		<UCard>
			<h3 class="text-lg font-semibold mb-4">Share with Residents</h3>
			<p class="text-sm text-gray-600 mb-4">
				Generate a one-time share link that residents can use to view your home information.
				Links expire after the specified time (max 30 days).
			</p>

			<div class="flex gap-4 items-end">
				<div class="flex-1">
					<UFormGroup label="Link expiration (days)">
						<UInput v-model.number="daysToExpire" type="number" min="1" max="30" />
					</UFormGroup>
				</div>
				<UButton :loading="loading" @click="generateShareLink">
					Generate Share Link
				</UButton>
			</div>

			<div v-if="shareUrl" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
				<div class="flex items-center justify-between mb-2">
					<span class="font-medium text-blue-900">Share URL</span>
					<UButton size="sm" variant="ghost" @click="copyShareLink">
						<UIcon name="i-lucide-copy" class="mr-2" />
						Copy
					</UButton>
				</div>
				code class="block text-sm bg-white p-3 rounded border text-blue-800 break-all">
					{{ shareUrl }}
				</code>
				<p v-if="shareCreated" class="mt-2 text-xs text-blue-700">
					Expires: {{ new Date(shareCreated.expiresAt).toLocaleString() }}
				</p>
			</div>
		</UCard>

		<UCard v-if="$isAdmin.value || props.home.ownerIds?.includes($currentUser?.uid)">
			<h3 class="text-lg font-semibold mb-4">Editors</h3>
			<p class="text-sm text-gray-600 mb-4">
				Add other users as editors to help manage this home.
			</p>

			<div class="flex gap-2 mb-4">
				<UInput v-model="editorEmail" placeholder="Editor's email address" />
				<UButton :loading="loading" @click="addEditor">Add</UButton>
			</div>

			<div v-if="editors.length" class="space-y-2">
				<div
					v-for="editor in editors"
					:key="editor.uid"
					class="flex items-center justify-between p-3 bg-gray-50 rounded"
				>
					<div>
						<p class="font-medium">{{ editor.uid }}</p>
						<p class="text-xs text-gray-500">Editor</p>
					</div>
					<UButton
						color="red"
						variant="ghost"
						size="icon"
						@click="removeEditor(editor.uid)"
					>
						<UIcon name="i-lucide-trash-2" />
					</UButton>
				</div>
			</div>
			<div v-else class="text-sm text-gray-500 text-center py-4">
				No editors added yet.
			</div>
		</UCard>
	</div>
</template>