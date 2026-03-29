<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
	error: NuxtError;
}>();

const { t } = useI18n();
const reporter = useErrorReporter();
const localePath = useLocalePath();
const isNotFound = computed(() => props.error?.statusCode === 404);
const isReportModalOpen = ref(false);
const statusCode = computed(() => Number(props.error?.statusCode || 500));
const statusText = computed(() => props.error?.statusMessage || (isNotFound.value ? t("error.notFoundTitle") : t("error.genericTitle")));
const description = computed(() => props.error?.message || props.error?.toString() || t("error.genericDescription"));

if (import.meta.client) {
	reporter.captureError({
		message: props.error?.message || (isNotFound.value ? "Seite nicht gefunden" : "Unbekannter Fehler"),
		source: isNotFound.value ? "route-not-found" : "nuxt-error-page",
		statusCode: props.error?.statusCode,
		stack: props.error?.stack,
	});
}
</script>

<template>
	<UApp>
		<div class="grid min-h-screen place-content-center overflow-hidden bg-white px-4 text-center tracking-wide text-[#020420] antialiased dark:bg-[#020420] dark:text-white">
			<div class="max-w-[520px]">
				<h1 class="mb-4 text-[80px] font-semibold leading-none tabular-nums sm:text-[110px]">
					{{ statusCode }}
				</h1>
				<h2 class="mb-2 text-2xl font-semibold sm:text-3xl">
					{{ statusText }}
				</h2>
				<p class="mb-6 px-2 text-md text-[#64748B]">
					{{ description }}
				</p>

				<div class="flex flex-col items-center justify-center gap-3">
					<NuxtLink
						:to="localePath('/')"
						class="text-sm font-medium underline underline-offset-3 hover:text-[#00DC82]"
					>
						{{ t("error.backHome") }}
					</NuxtLink>
					<UButton
						color="primary"
						variant="solid"
						size="sm"
						icon="i-lucide-bug"
						class="rounded-full px-4"
						@click="isReportModalOpen = true"
					>
						{{ t("error.addContextAction") }}
					</UButton>
				</div>
			</div>
		</div>

		<UModal v-model:open="isReportModalOpen" :title="t('error.addContextTitle')" :ui="{ content: 'sm:max-w-2xl' }">
			<template #body>
				<UiErrorReportForm
					:report="reporter.activeReport.value"
					@submitted="isReportModalOpen = false" />
			</template>
			<template #footer>
				<div class="flex w-full justify-end">
					<UButton variant="ghost" @click="isReportModalOpen = false">
						{{ t("error.close") }}
					</UButton>
				</div>
			</template>
		</UModal>
	</UApp>
</template>
