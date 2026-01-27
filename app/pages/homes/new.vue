<script setup lang="ts">
definePageMeta({ middleware: ["is-owner"] });

const { $token } = useNuxtApp();
const router = useRouter();
const toast = useToast();

const form = ref({
	name: "",
	contact: {
		phone: "",
		email: "",
		name: "",
	},
	wifiPassword: "",
	checkInInfo: "",
	checkOutInfo: "",
	mustKnows: [],
	houseRules: "",
	blanketsInfo: "",
	cleaningInfo: [],
	parkingNumber: "",
});

const loading = ref(false);
const error = ref<string | null>(null);

const mustKnowsInput = ref("");
const cleaningInfoInput = ref("");

const mustKnowsArray = computed(() => form.value.mustKnows || []);
const cleaningInfoArray = computed(() => form.value.cleaningInfo || []);

const addMustKnow = () => {
	const item = mustKnowsInput.value.trim();
	if (item && !mustKnowsArray.value.includes(item)) {
		form.value.mustKnows.push(item);
		mustKnowsInput.value = "";
	}
};

const removeMustKnow = (index: number) => {
	form.value.mustKnows.splice(index, 1);
};

const addCleaningInfo = () => {
	const item = cleaningInfoInput.value.trim();
	if (item && !cleaningInfoArray.value.includes(item)) {
		form.value.cleaningInfo.push(item);
		cleaningInfoInput.value = "";
	}
};

const removeCleaningInfo = (index: number) => {
	form.value.cleaningInfo.splice(index, 1);
};

const submit = async () => {
	if (!form.value.name) {
		error.value = "Home number is required";
		return;
	}

	try {
		loading.value = true;
		error.value = null;

		const newHome = await $fetch("/api/homes/create", {
			method: "POST",
			headers: { Authorization: `Bearer ${$token.value}` },
			body: form.value,
		});

		toast.add({ title: "Home created successfully!", color: "green" });
		router.push(`/homes/${newHome.id}/edit`);
	} catch (e: any) {
		error.value = e.data?.message || e.message || "Failed to create home";
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<div class="max-w-screen-lg mx-auto px-4 py-8">
		<h1 class="text-3xl font-bold mb-8">Create New Home</h1>

		<div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
			{{ error }}
		</div>

		<UCard>
			<form @submit.prevent="submit" class="space-y-6">
				<div>
					<UFormGroup label="Home Number" required>
						<UInput v-model="form.name" type="number" placeholder="1-30 (or configured max)" required />
					</UFormGroup>
				</div>

				<UFormGroup label="Contact Information">
					<div class="space-y-4">
						<UInput v-model="form.contact.name" placeholder="Owner name" />
						<UInput v-model="form.contact.phone" placeholder="Phone number" type="tel" />
						<UInput v-model="form.contact.email" placeholder="Email address" type="email" />
					</div>
				</UFormGroup>

				<UFormGroup label="WiFi Password">
					<UInput v-model="form.wifiPassword" placeholder="WiFi password" />
				</UFormGroup>

				<UFormGroup label="Parking Number">
					<UInput v-model="form.parkingNumber" placeholder="Parking spot number" />
				</UFormGroup>

				<UFormGroup label="Check-in Information">
					<UTextarea v-model="form.checkInInfo" placeholder="Enter check-in instructions..." rows="4" />
				</UFormGroup>

				<UFormGroup label="Check-out Information">
					<UTextarea v-model="form.checkOutInfo" placeholder="Enter check-out instructions..." rows="4" />
				</UFormGroup>

				<UFormGroup label="Must Knows">
					<div class="space-y-2">
						<div class="flex gap-2">
							<UInput v-model="mustKnowsInput" placeholder="Add a must-know item" @keyup.enter="addMustKnow" />
							<UButton type="button" @click="addMustKnow">Add</UButton>
						</div>
						<div v-if="mustKnowsArray.length" class="flex flex-wrap gap-2 mt-2">
							<UChip
								v-for="(item, index) in mustKnowsArray"
								:key="index"
								closable
								@close="removeMustKnow(index)"
							>
								{{ item }}
							</UChip>
						</div>
					</div>
				</UFormGroup>

				<UFormGroup label="Cleaning Information">
					<div class="space-y-2">
						<div class="flex gap-2">
							<UInput v-model="cleaningInfoInput" placeholder="Add cleaning info" @keyup.enter="addCleaningInfo" />
							<UButton type="button" @click="addCleaningInfo">Add</UButton>
						</div>
						<div v-if="cleaningInfoArray.length" class="flex flex-wrap gap-2 mt-2">
							<UChip
								v-for="(item, index) in cleaningInfoArray"
								:key="index"
								closable
								@close="removeCleaningInfo(index)"
							>
								{{ item }}
							</UChip>
						</div>
					</div>
				</UFormGroup>

				<UFormGroup label="House Rules">
					<UTextarea v-model="form.houseRules" placeholder="Enter house rules..." rows="4" />
				</UFormGroup>

				<UFormGroup label="Blankets Information">
					<UTextarea v-model="form.blanketsInfo" placeholder="Enter information about blankets..." rows="4" />
				</UFormGroup>

				<div class="flex justify-end gap-4">
					<NuxtLink to="/homes">
						<UButton variant="ghost">Cancel</UButton>
					</NuxtLink>
					<UButton type="submit" :loading="loading">Create Home</UButton>
				</div>
			</form>
		</UCard>
	</div>
</template>