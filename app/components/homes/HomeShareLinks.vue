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
const durationPreset = ref<"7" | "30" | "unlimited" | "custom">("7");
const customDays = ref(14);

const daysToExpire = computed(() => {
	switch (durationPreset.value) {
		case "7": return 7;
		case "30": return 30;
		case "unlimited": return 3650;
		case "custom": return Math.min(Math.max(customDays.value || 1, 1), 3650);
		default: return 7;
	}
});

const expirationDate = computed(() => {
	const date = new Date();
	date.setDate(date.getDate() + daysToExpire.value);
	return date.toLocaleDateString("de-CH", { 
		day: "2-digit", 
		month: "2-digit", 
		year: "numeric" 
	});
});

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

const durationOptions = [
	{ value: "7", label: "7 Tage" },
	{ value: "30", label: "30 Tage" },
	{ value: "unlimited", label: "Unbegrenzt (10 Jahre)" },
	{ value: "custom", label: "Benutzerdefiniert" },
];
</script>

<template>
	<div class="space-y-6">
		<!-- Create new share -->
		<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
			<h3 class="font-bold mb-4">Neuen Link erstellen</h3>
			
			<div class="space-y-4">
				<!-- Duration options -->
				<div class="space-y-2">
					<p class="text-sm font-medium text-stone-700 dark:text-stone-300">Gültigkeitsdauer</p>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						<button
							v-for="option in durationOptions"
							:key="option.value"
							@click="durationPreset = option.value as any"
							class="px-3 py-2 text-sm rounded-lg border-2 transition-all text-center"
							:class="durationPreset === option.value
								? 'border-primary bg-primary-50 dark:bg-primary-900/20 text-primary font-medium'
								: 'border-stone-200 dark:border-stone-700 hover:border-primary text-stone-600 dark:text-stone-400'"
						>
							{{ option.label }}
						</button>
					</div>
				</div>

				<!-- Custom days input -->
				<div v-if="durationPreset === 'custom'" class="flex items-center gap-2">
					<UInput
						v-model.number="customDays"
						type="number"
						min="1"
						max="3650"
						placeholder="Anzahl Tage"
						size="lg"
						class="w-32"
					/>
					<span class="text-sm text-stone-500">Tage</span>
				</div>

				<!-- Expiration preview -->
				<div class="flex items-center gap-2 text-sm text-stone-500">
					<UIcon name="i-lucide-calendar" class="w-4 h-4" />
					<span>Läuft ab am: <strong class="text-stone-700 dark:text-stone-300">{{ expirationDate }}</strong></span>
				</div>

				<!-- Create button -->
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
