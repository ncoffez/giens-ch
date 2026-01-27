<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	houseRules: props.home?.houseRules || "",
	blanketsInfo: props.home?.blanketsInfo || "",
	cleaningInfo: [...(props.home?.cleaningInfo || [])],
	washingMachineOverride: props.home?.washingMachineOverride || "",
});

const loading = ref(false);
const cleaningInfoInput = ref("");

const addCleaningInfo = () => {
	const item = cleaningInfoInput.value.trim();
	if (item && !form.cleaningInfo.includes(item)) {
		form.cleaningInfo.push(item);
		cleaningInfoInput.value = "";
	}
};

const removeCleaningInfo = (index: number) => {
	form.cleaningInfo.splice(index, 1);
};

const save = async () => {
	try {
		loading.value = true;
		await $fetch(`/api/homes/${props.home.id}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: form,
		});
		toast.add({ title: "Saved successfully!", color: "green" });
		emit("refresh");
	} catch (e: any) {
		toast.add({ title: e.data?.message || e.message || "Failed to save", color: "red" });
	} finally {
		loading.value = false;
	}
};

watch(() => props.home, (newHome) => {
	if (newHome) {
		form.houseRules = newHome.houseRules || "";
		form.blanketsInfo = newHome.blanketsInfo || "";
		form.cleaningInfo = [...(newHome.cleaningInfo || [])];
		form.washingMachineOverride = newHome.washingMachineOverride || "";
	}
}, { immediate: true });
</script>

<template>
	<UCard class="space-y-6">
		<form @submit.prevent="save">
			<UFormGroup label="House Rules" description="Rules for residents to follow">
				<UTextarea v-model="form.houseRules" placeholder="Enter house rules..." rows="6" />
			</UFormGroup>

			<UFormGroup label="Blankets Information" description="Information about blankets and bedding">
				<UTextarea v-model="form.blanketsInfo" placeholder="Enter blanket information..." rows="4" />
			</UFormGroup>

			<UFormGroup label="Cleaning Information" description="Cleaning instructions">
				<div class="space-y-2">
					<div class="flex gap-2">
						<UInput
							v-model="cleaningInfoInput"
							placeholder="Add cleaning instruction"
							@keyup.enter="addCleaningInfo"
						/>
						<UButton type="button" variant="outline" @click="addCleaningInfo">Add</UButton>
					</div>
					<div v-if="form.cleaningInfo.length" class="space-y-2 mt-4">
						<div
							v-for="(item, index) in form.cleaningInfo"
							:key="index"
							class="flex items-center justify-between p-3 bg-gray-50 rounded"
						>
							<span>{{ item }}</span>
							<UButton
								color="red"
								variant="ghost"
								size="icon"
								@click="removeCleaningInfo(index)"
							>
								<UIcon name="i-lucide-x" />
							</UButton>
						</div>
					</div>
				</div>
			</UFormGroup>

			<UFormGroup
				label="Washing Machine Instructions Override"
				description="Override the global default washing machine instructions (optional)"
			>
				<UTextarea
					v-model="form.washingMachineOverride"
					placeholder="Enter custom washing machine instructions or leave empty for global default..."
					rows="4"
				/>
			</UFormGroup>

			<UButton type="submit" :loading="loading">Save Changes</UButton>
		</form>
	</UCard>
</template>