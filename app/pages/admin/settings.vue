<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { token } = useAuthReady();
const toast = useToast();

const settings = ref({
	maxHomeNumber: 30,
	washingMachineUse: "",
	homesFeatureEnabled: false,
});

const loading = ref(false);
const error = ref<string | null>(null);

const fetchSettings = async () => {
	try {
		loading.value = true;
		error.value = null;
		const data = await $fetch("/api/settings");
		settings.value = data;
	} catch (e: unknown) {
		error.value = getFetchError(e) || "Failed to load settings";
	} finally {
		loading.value = false;
	}
};

const save = async () => {
	try {
		loading.value = true;
		await $fetch("/api/settings.update", {
			method: "POST",
			headers: { Authorization: `Bearer ${token.value}` },
			body: settings.value,
		});
		toast.add({ title: "Settings saved successfully!", color: "green" });
	} catch (e: unknown) {
		toast.add({ title: getFetchError(e) || "Failed to save settings", color: "red" });
	} finally {
		loading.value = false;
	}
};

onMounted(fetchSettings);
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8">
		<h1 class="text-3xl font-bold mb-8">Admin Settings</h1>

		<div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
			{{ error }}
		</div>

		<UCard>
			<form @submit.prevent="save" class="space-y-6">
				<UFormField
					label="Maximum Home Number"
					description="The highest home number allowed (e.g., 30 for homes 1-30)"
				>
					<UInput
						v-model.number="settings.maxHomeNumber"
						type="number"
						min="1"
					/>
				</UFormField>

				<UFormField
					label="Default Washing Machine Instructions"
					description="These instructions apply to all homes unless overridden"
				>
					<UTextarea
						v-model="settings.washingMachineUse"
						placeholder="Enter washing machine instructions..."
						:rows="6"
					/>
				</UFormField>

				<USeparator />

				<div class="space-y-4">
					<h2 class="text-lg font-semibold">Feature Flags</h2>
					<UFormField
						label="Homes Feature"
						description="Enable the 'Mein Haus' section for all users. When disabled, only admins can access this feature."
					>
						<USwitch v-model="settings.homesFeatureEnabled" />
					</UFormField>
				</div>

				<UButton type="submit" :loading="loading">Save Settings</UButton>
			</form>
		</UCard>
	</div>
</template>