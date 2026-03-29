<script setup lang="ts">
import type { ErrorReportPayload } from "../../utils/errorReporting";
import { getFetchError } from "../../utils/error";

const props = defineProps<{
	report: ErrorReportPayload | null;
}>();

const emit = defineEmits<{
	submitted: [];
}>();

const { t } = useI18n();
const toast = useAppToast();
const userNotes = ref("");
const isSubmitting = ref(false);
const createdIssueNumber = ref<number | null>(null);
const submissionAction = ref<"created" | "commented" | null>(null);
const hasUserNotes = computed(() => userNotes.value.trim().length > 0);
const textareaUi = {
	root: "w-full",
	base: "w-full min-h-32 resize-y rounded-xl px-4 py-3 leading-relaxed",
};
const logTextareaUi = {
	root: "w-full",
	base: "w-full min-h-56 resize-y rounded-xl px-4 py-3 font-mono text-xs leading-6",
};

const actionPreview = computed(() => {
	if (!props.report?.actions?.length) {
		return "Keine aufgezeichneten Aktionen.";
	}

	return props.report.actions.map((action) => {
		return `${action.timestamp} [${action.type}] ${action.label}${action.details ? ` (${action.details})` : ""}`;
	}).join("\n");
});

async function submitReport() {
	if (!props.report) {
		return;
	}

	if (!hasUserNotes.value) {
		return;
	}

	isSubmitting.value = true;
	try {
		const result = await $fetch<{ number: number; url: string; action: "created" | "commented" }>("/api/error-reports", {
			method: "POST",
			body: {
				report: props.report,
				submission: {
					userNotes: userNotes.value,
				},
			},
		});
		createdIssueNumber.value = result.number;
		submissionAction.value = result.action;
		toast.success(
			t("error.reportSuccessTitle"),
			t(result.action === "commented" ? "error.reportCommentSuccessDescription" : "error.reportSuccessDescription", { number: result.number }),
		);
		emit("submitted");
	} catch (error: unknown) {
		toast.error(t("error.reportFailureTitle"), getFetchError(error));
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<div class="space-y-5">
		<div class="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-900/70">
			<p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-primary)]">
				{{ t("error.autoLoggedLabel") }}
			</p>
			<p class="text-sm font-semibold text-stone-900 dark:text-white">
				{{ report?.message || t("error.reportSummaryFallback") }}
			</p>
			<p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
				{{ t("error.routeLabel") }}: <span class="font-medium text-stone-700 dark:text-stone-200">{{ report?.routePath || "-" }}</span>
			</p>
			<p class="text-sm text-stone-500 dark:text-stone-400">
				{{ t("error.sourceLabel") }}: <span class="font-medium text-stone-700 dark:text-stone-200">{{ report?.source || "-" }}</span>
			</p>
			<p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
				{{ t("error.autoLoggedDescription") }}
			</p>
		</div>

		<UFormField :label="t('error.whatHappenedLabel')">
			<UTextarea
				v-model="userNotes"
				:rows="4"
				:ui="textareaUi"
				:placeholder="t('error.whatHappenedPlaceholder')"
			/>
		</UFormField>

		<details class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
			<summary class="cursor-pointer text-sm font-semibold text-stone-800 dark:text-stone-200">
				{{ t("error.technicalDetails") }}
			</summary>
			<div class="mt-4 space-y-3 text-sm text-stone-500 dark:text-stone-400">
				<p><strong>{{ t("error.previousRouteLabel") }}:</strong> {{ report?.previousRoute || t("error.notAvailable") }}</p>
				<p><strong>{{ t("error.referrerLabel") }}:</strong> {{ report?.referrer || t("error.notAvailable") }}</p>
				<p><strong>{{ t("error.viewportLabel") }}:</strong> {{ report?.viewport || t("error.notAvailable") }}</p>
				<p><strong>{{ t("error.localeLabel") }}:</strong> {{ report?.locale || t("error.notAvailable") }}</p>
				<UFormField :label="t('error.loggedActionsLabel')">
					<UTextarea :model-value="actionPreview" :rows="8" :ui="logTextareaUi" readonly />
				</UFormField>
			</div>
		</details>

		<div class="flex items-center justify-between gap-3">
			<p v-if="createdIssueNumber" class="text-sm text-emerald-600 dark:text-emerald-400">
				{{ t(submissionAction === "commented" ? "error.issueCommented" : "error.issueCreated", { number: createdIssueNumber }) }}
			</p>
			<div class="ml-auto">
				<UButton
					color="primary"
					icon="i-lucide-bug"
					:disabled="!hasUserNotes"
					:loading="isSubmitting"
					@click="submitReport"
				>
					{{ t("error.submitComment") }}
				</UButton>
			</div>
		</div>
	</div>
</template>
