<script setup lang="ts">
import type { HomeShare } from "~/types";

const props = defineProps<{
	homeId: string;
	shares: Array<HomeShare & { shareUrl?: string }>;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { getFreshToken } = useAuthReady();
const toast = useToast();
const { t, locale } = useI18n();

const creating = ref(false);
const renewing = ref(false);
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
	return date.toLocaleDateString(locale.value === "fr" ? "fr-CH" : "de-CH", {
		day: "2-digit", 
		month: "2-digit", 
		year: "numeric" 
	});
});

const prospectShare = computed(() => {
	return props.shares.find((share) => share.audience === "prospect" && !share.revoked) || null;
});

const tenantShares = computed(() => props.shares.filter((share) => share.audience !== "prospect"));

const activeShares = computed(() => {
	return tenantShares.value.filter((share) => !share.revoked && Boolean(share.expiresAt) && new Date(share.expiresAt) > new Date());
});

const expiredOrRevokedShares = computed(() => {
	return tenantShares.value.filter((share) => share.revoked || !share.expiresAt || new Date(share.expiresAt) <= new Date());
});

const createShare = async () => {
	try {
		creating.value = true;
		const result = await $fetch<{ shareUrl: string }>(`/api/homes/${props.homeId}/share/create`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { daysToExpire: daysToExpire.value },
		});

		toast.add({ title: t("homes.shareLinks.toasts.created"), color: "success" });
		emit("refresh");

		// Copy to clipboard
		await navigator.clipboard.writeText(result.shareUrl);
		toast.add({ title: t("homes.shareLinks.toasts.copiedToClipboard"), color: "success" });
	} catch (e: unknown) {
		toast.add({ title: t("homes.shareLinks.toasts.error"), description: getFetchError(e), color: "error" });
	} finally {
		creating.value = false;
	}
};

const renewProspect = async () => {
	if (!confirm(t("homes.shareLinks.confirmRenew"))) return;

	try {
		renewing.value = true;
		const result = await $fetch<{ shareUrl: string }>(`/api/homes/${props.homeId}/share/renew`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
		});
		toast.add({ title: t("homes.shareLinks.toasts.renewed"), color: "success" });
		emit("refresh");
		await navigator.clipboard.writeText(result.shareUrl);
		toast.add({ title: t("homes.shareLinks.toasts.copiedToClipboard"), color: "success" });
	} catch (e: unknown) {
		toast.add({ title: t("homes.shareLinks.toasts.error"), description: getFetchError(e), color: "error" });
	} finally {
		renewing.value = false;
	}
};

const copyLink = async (url: string) => {
	await navigator.clipboard.writeText(url);
	toast.add({ title: t("homes.shareLinks.toasts.copied"), color: "success" });
};

const revokeShare = async (shareId: string) => {
	if (!confirm(t("homes.shareLinks.confirmRevoke"))) return;

	try {
		await $fetch(`/api/homes/${props.homeId}/share/revoke`, {
			method: "POST",
			headers: { Authorization: `Bearer ${await getFreshToken()}` },
			body: { shareId },
		});
		toast.add({ title: t("homes.shareLinks.toasts.revoked"), color: "success" });
		emit("refresh");
	} catch (e: unknown) {
		toast.add({ title: t("homes.shareLinks.toasts.error"), description: getFetchError(e), color: "error" });
	}
};

const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString(locale.value === "fr" ? "fr-CH" : "de-CH", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const durationOptions = [
	{ value: "7", label: "homes.shareLinks.duration.7" },
	{ value: "30", label: "homes.shareLinks.duration.30" },
	{ value: "unlimited", label: "homes.shareLinks.duration.unlimited" },
	{ value: "custom", label: "homes.shareLinks.duration.custom" },
];
</script>

<template>
	<div class="space-y-8">
		<section v-if="prospectShare" class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-4">
			<div>
				<h3 class="font-bold">{{ t("homes.shareLinks.prospectTitle") }}</h3>
				<p class="text-sm text-stone-500 mt-2">{{ t("homes.shareLinks.prospectLead") }}</p>
			</div>
			<div class="flex items-center gap-2 text-sm text-stone-500">
				<UIcon name="i-lucide-infinity" class="w-4 h-4" />
				<span>{{ t("homes.shareLinks.noExpiry") }}</span>
				<span class="text-stone-300">|</span>
				<span>{{ t("homes.shareLinks.accessCount", { count: prospectShare.accessCount }) }}</span>
			</div>
			<code class="block text-xs p-2 bg-stone-50 dark:bg-stone-900 rounded-lg truncate">
				{{ prospectShare.shareUrl }}
			</code>
			<div class="flex flex-wrap gap-2">
				<UButton icon="i-lucide-copy" @click="copyLink(prospectShare.shareUrl || '')">
					{{ t("homes.shareLinks.copy") }}
				</UButton>
				<UButton
					variant="outline"
					color="neutral"
					icon="i-lucide-external-link"
					:to="prospectShare.shareUrl"
					target="_blank"
				>
					{{ t("homes.shareLinks.open") }}
				</UButton>
				<UButton
					variant="outline"
					color="neutral"
					icon="i-lucide-refresh-cw"
					:loading="renewing"
					@click="renewProspect"
				>
					{{ t("homes.shareLinks.renew") }}
				</UButton>
			</div>
		</section>

		<section class="space-y-6">
			<div>
				<h3 class="font-bold text-lg">{{ t("homes.shareLinks.tenantTitle") }}</h3>
				<p class="text-sm text-stone-500 mt-2">{{ t("homes.shareLinks.tenantLead") }}</p>
			</div>

		<!-- Create new share -->
		<div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
			<h3 class="font-bold mb-4">{{ t("homes.shareLinks.createTitle") }}</h3>
			
			<div class="space-y-4">
				<!-- Duration options -->
				<div class="space-y-2">
					<p class="text-sm font-medium text-stone-700 dark:text-stone-300">{{ t("homes.shareLinks.durationLabel") }}</p>
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
							{{ t(option.label) }}
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
						:placeholder="t('homes.shareLinks.customDaysPlaceholder')"
						size="lg"
						class="w-32"
					/>
					<span class="text-sm text-stone-500">{{ t("homes.shareLinks.days") }}</span>
				</div>

				<!-- Expiration preview -->
				<div class="flex items-center gap-2 text-sm text-stone-500">
					<UIcon name="i-lucide-calendar" class="w-4 h-4" />
					<span>{{ t("homes.shareLinks.expiresOn") }} <strong class="text-stone-700 dark:text-stone-300">{{ expirationDate }}</strong></span>
				</div>

				<!-- Create button -->
				<UButton :loading="creating" icon="i-lucide-link" size="lg" @click="createShare">
					{{ t("homes.shareLinks.createAction") }}
				</UButton>
			</div>
		</div>

		<!-- Active shares -->
		<div v-if="activeShares.length > 0" class="space-y-3">
			<h3 class="font-bold text-lg">{{ t("homes.shareLinks.activeTitle") }}</h3>
			<div
				v-for="share in activeShares"
				:key="share.id"
				class="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 text-sm text-stone-500 mb-2">
							<UIcon name="i-lucide-clock" class="w-4 h-4" />
							<span>{{ t("homes.shareLinks.expiresAt") }} {{ formatDate(share.expiresAt) }}</span>
							<span class="text-stone-300">|</span>
							<span>{{ t("homes.shareLinks.accessCount", { count: share.accessCount }) }}</span>
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
			<p class="text-stone-500">{{ t("homes.shareLinks.emptyTitle") }}</p>
			<p class="text-sm text-stone-400">{{ t("homes.shareLinks.emptyDescription") }}</p>
		</div>

		<!-- Expired/Revoked shares -->
		<details v-if="expiredOrRevokedShares.length > 0" class="group">
			<summary class="cursor-pointer text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
				{{ t("homes.shareLinks.archivedToggle", { count: expiredOrRevokedShares.length }) }}
			</summary>
			<div class="mt-3 space-y-2">
				<div
					v-for="share in expiredOrRevokedShares"
					:key="share.id"
					class="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 text-sm text-stone-400"
				>
					<span v-if="share.revoked">{{ t("homes.shareLinks.revoked") }}</span>
					<span v-else>{{ t("homes.shareLinks.expired") }}</span>
					{{ t("homes.shareLinks.onDate") }} {{ formatDate(share.revoked ? share.expiresAt : share.expiresAt) }}
				</div>
			</div>
		</details>
		</section>
	</div>
</template>
