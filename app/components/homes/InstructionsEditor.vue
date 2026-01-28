<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	checkInInfo: props.home?.checkInInfo || "",
	checkOutInfo: props.home?.checkOutInfo || "",
	mustKnows: [...(props.home?.mustKnows || [])],
});

const loading = ref(false);
const mustKnowsInput = ref("");

const addMustKnow = () => {
	const item = mustKnowsInput.value.trim();
	if (item && !form.mustKnows.includes(item)) {
		form.mustKnows.push(item);
		mustKnowsInput.value = "";
	}
};

const removeMustKnow = (index: number) => {
	form.mustKnows.splice(index, 1);
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
		form.checkInInfo = newHome.checkInInfo || "";
		form.checkOutInfo = newHome.checkOutInfo || "";
		form.mustKnows = [...(newHome.mustKnows || [])];
	}
}, { immediate: true });
</script>

<template>
	<UCard>
		<form @submit.prevent="save" class="space-y-6">
			<UFormField label="Check-in Information" description="Instructions for checking in">
				<UTextarea v-model="form.checkInInfo" placeholder="Enter check-in instructions..." :rows="6" />
			</UFormField>

			<UFormField label="Check-out Information" description="Instructions for checking out">
				<UTextarea v-model="form.checkOutInfo" placeholder="Enter check-out instructions..." :rows="6" />
			</UFormField>

			<UFormField label="Must Knows" description="Important information residents need to know">
				<div class="space-y-2">
					<div class="flex gap-2">
						<UInput
							v-model="mustKnowsInput"
							placeholder="Add a must-know item"
							@keyup.enter="addMustKnow"
						/>
						<UButton type="button" variant="outline" @click="addMustKnow">Add</UButton>
					</div>
					<div v-if="form.mustKnows.length" class="space-y-2 mt-4">
						<div
							v-for="(item, index) in form.mustKnows"
							:key="index"
							class="flex items-center justify-between p-3 bg-gray-50 rounded"
						>
							<span>{{ item }}</span>
							<UButton
								color="red"
								variant="ghost"
								icon="i-lucide-x"
								@click="removeMustKnow(index)"
							/>
						</div>
					</div>
				</div>
			</UFormField>

			<UButton type="submit" :loading="loading">Save Changes</UButton>
		</form>
	</UCard>
</template>