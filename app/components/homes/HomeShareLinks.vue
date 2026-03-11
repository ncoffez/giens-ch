<script setup lang="ts">
import type { HomeShare } from "~/types";

const props = defineProps<{
	homeId: string;
	shares: HomeShare[];
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { token } = useAuthReady();
const toast = useToast();

const creating = ref(false);
const daysToExpire = ref(7);

const activeShares = computed(() => {
	return props.shares.filter((s) => !s.revoked && new Date(s.expiresAt) > new Date());
});

const expiredOrRevokedShares = computed(() => {
	return props.shares.filter((s) => s.revoked || new Date(s.expiresAt) <= new Date());
});

const createShare = async () => {
	try {
		creating.value = true;
		const result = await $fetch<{ shareUrl: string }>(`/api/homes/${props.homeId}/share/create`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { daysToExpire: daysToExpire.value },
		});

		toast.add({ title: "Link erstellt", color: "success" });
		emit("refresh");

		// Copy to clipboard
		await navigator.clipboard.writeText(result.shareUrl);
		toast.add({ title: "Link in Zwischenablage kopiert", color: "success" });
	} catch (e: unknown) {
		toast.add({ title: "Fehler", description: getFetchError(e), color: "error" });
	} finally {
		creating.value = false;
	}
};

const copyLink = async (url: string) => {
	await navigator.clipboard.writeText(url);
	toast.add({ title: "Link kopiert", color: "success" });
};

const revokeShare = async (shareId: string) => {
	if (!confirm("Link wirklich widerrufen?")) return;

	try {
		await $fetch(`/api/homes/${props.homeId}/share/revoke`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: { shareId },
		});
		toast.add({ title: "Link widerrufen", color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: "Fehler", description: getFetchError(e), color: "error" });
	}
};

const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString("de-CH", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};
</script>

<template>
	<div class="space-y-6">
		<!-- Create new share -->
		<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
			<h3 class="font-bold mb-4">Neuen Link erstellen</h3>
			<div class="flex flex-col sm:flex-row gap-4 items-end">
				<UFormField label="Gültig für (Tage)" class="flex-1">
					<UInput v-model.number="daysToExpire" type="number" min="1" max="30" size="lg" />
				</UFormField>
				<UButton :loading="creating" icon="i-lucide-link" size="lg" @click="createShare">
					Link erstellen
				</UButton>
			</div>
		</div>

		<!-- Active shares -->
		<div v-if="activeShares.length > 0" class="space-y-3">
			<h3 class="font-bold text-lg">Aktive Links</h3>
			<div
				v-for="share in activeShares"
				:key="share.id"
				class="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 text-sm text-stone-500 mb-2">
							<UIcon name="i-lucide-clock" class="w-4 h-4" />
							<span>Läuft ab: {{ formatDate(share.expiresAt) }}</span>
							<span class="text-stone-300">|</span>
							<span>{{ share.accessCount }} Aufrufe</span>
						</div>
						<code class="block text-xs p-2 bg-stone-50 dark:bg-stone-900 rounded-lg truncate">
							{{ (share as any).shareUrl }}
						</code>
					</div>
					<div class="flex items-center gap-2 shrink-0">
						<UButton
							variant="ghost"
							color="neutral"
							icon="i-lucide-copy"
							size="sm"
							@click="copyLink((share as any).shareUrl)"
						/>
						<UButton
							variant="ghost"
							color="error"
							icon="i-lucide-trash-2"
							size="sm"
							@click="revokeShare(share.id)"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- No active shares -->
		<div v-else class="text-center py-8 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
			<UIcon name="i-lucide-link" class="w-10 h-10 mx-auto text-stone-300 mb-3" />
			<p class="text-stone-500">Keine aktiven Links</p>
			<p class="text-sm text-stone-400">Erstellen Sie einen Link, um ihn mit Mietern zu teilen</p>
		</div>

		<!-- Expired/Revoked shares -->
		<details v-if="expiredOrRevokedShares.length > 0" class="group">
			<summary class="cursor-pointer text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
				{{ expiredOrRevokedShares.length }} abgelaufene/widerrufene Links anzeigen
			</summary>
			<div class="mt-3 space-y-2">
				<div
					v-for="share in expiredOrRevokedShares"
					:key="share.id"
					class="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 text-sm text-stone-400"
				>
					<span v-if="share.revoked">Widerrufen</span>
					<span v-else>Abgelaufen</span>
					am {{ formatDate(share.revoked ? share.expiresAt : share.expiresAt) }}
				</div>
			</div>
		</details>
	</div>
</template>
