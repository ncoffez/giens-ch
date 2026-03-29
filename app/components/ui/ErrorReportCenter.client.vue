<script setup lang="ts">
const reporter = useErrorReporter();

function handleSubmitted() {
	reporter.closeDialog();
}
</script>

<template>
	<div v-if="reporter.activeReport.value">
		<div class="fixed bottom-24 right-4 z-[70] md:bottom-6">
			<UButton
				color="error"
				icon="i-lucide-bug"
				class="rounded-full shadow-lg"
				@click="reporter.openDialog()"
			>
				Fehler melden
			</UButton>
		</div>

		<UModal v-model:open="reporter.isDialogOpen.value" title="Fehler melden" :ui="{ content: 'sm:max-w-2xl' }">
			<template #body>
				<UiErrorReportForm :report="reporter.activeReport.value" @submitted="handleSubmitted" />
			</template>
			<template #footer>
				<div class="flex w-full justify-end">
					<UButton variant="ghost" @click="reporter.closeDialog()">
						Schliessen
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
