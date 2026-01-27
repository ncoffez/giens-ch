<script setup lang="ts">
definePageMeta({ middleware: ["is-admin"] });

const { $token } = useNuxtApp();
const toast = useToast();

const settings = ref({
	maxHomeNumber: 30,
	washingMachineUse: "",
});

const loading = ref(false);
const error = ref<string | null>(null);

const fetchSettings = async () => {
	try {
		loading.value = true;
		error.value = null;
		const data = await $fetch("/api/settings");
		settings.value = data;
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to load settings";
	} finally {
		loading.value = false;
	}
};

const save = async () => {
	try {
		loading.value = true;
		await $fetch("/api/settings.update", {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: settings.value,
		});
		toast.add({ title: "Settings saved successfully!", color: "green" });
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to save settings", color: "red" });
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
				<UFormGroup
					label="Maximum Home Number"
					description="The highest home number allowed (e.g., 30 for homes 1-30)"
				>
					<UInput
						v-model.number="settings.maxHomeNumber"
						type="number"
						min="1"
					/>
				</UFormGroup>

				<UFormGroup
					label="Default Washing Machine Instructions"
					description="These instructions apply to all homes unless overridden"
				>
					<UTextarea
						v-model="settings.washingMachineUse"
						placeholder="Enter washing machine instructions..."
						rows="6"
					/>
				</UFormGroup>

				<UButton type="submit" :loading="loading">Save Settings</UButton>
			</form>
		</UCard>
	</div>
</template>