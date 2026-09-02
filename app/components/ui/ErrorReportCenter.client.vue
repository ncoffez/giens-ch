<script setup lang="ts">
const { t } = useI18n();
const reporter = useErrorReporter();

function handleSubmitted() {
	reporter.closeDialog();
}
</script>

<template>
	<div>
		<!--
			The trigger is always visible: neutral and unobtrusive while everything
			works, red as soon as an error has been captured on this page.
		-->
		<div class="fixed bottom-24 right-4 z-[70] md:bottom-6">
			<UButton
				:color="reporter.hasActiveError.value ? 'error' : 'neutral'"
				:variant="reporter.hasActiveError.value ? 'solid' : 'subtle'"
				icon="i-lucide-bug"
				class="rounded-full shadow-lg transition-colors"
				:class="reporter.hasActiveError.value
					? ''
					: 'text-stone-500 dark:text-stone-400 bg-white/80 dark:bg-stone-900/80 backdrop-blur hover:text-stone-700 dark:hover:text-stone-200'"
				:aria-label="t('error.reportAction')"
				@click="reporter.openDialog()"
			>
				{{ t("error.reportAction") }}
			</UButton>
		</div>

		<UModal
			v-model:open="reporter.isDialogOpen.value"
			:title="reporter.hasActiveError.value ? t('error.addContextTitle') : t('error.reportTitle')"
			:ui="{ content: 'sm:max-w-2xl' }"
		>
			<template #body>
				<UiErrorReportForm
					:report="reporter.dialogReport.value"
					:auto-logged="reporter.hasActiveError.value"
					@submitted="handleSubmitted"
				/>
			</template>
			<template #footer>
				<div class="flex w-full justify-end">
					<UButton variant="ghost" @click="reporter.closeDialog()">
						{{ t("error.close") }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
