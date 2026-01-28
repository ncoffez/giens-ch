<script setup lang="ts">
const props = defineProps<{ home: any }>();
const emit = defineEmits(["refresh"]);

const { $token } = useNuxtApp();
const toast = useToast();

const form = reactive({
	name: props.home?.name || "",
	wifiPassword: props.home?.wifiPassword || "",
	parkingNumber: props.home?.parkingNumber || "",
	contact: {
		name: props.home?.contact?.name || "",
		phone: props.home?.contact?.phone || "",
		email: props.home?.contact?.email || "",
	},
});

const loading = ref(false);

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
		form.name = newHome.name || "";
		form.wifiPassword = newHome.wifiPassword || "";
		form.parkingNumber = newHome.parkingNumber || "";
		form.contact.name = newHome.contact?.name || "";
		form.contact.phone = newHome.contact?.phone || "";
		form.contact.email = newHome.contact?.email || "";
	}
}, { immediate: true });
</script>

<template>
	<UCard>
		<form @submit.prevent="save" class="space-y-6">
			<UFormField label="Home Name">
				<UInput v-model="form.name" type="number" placeholder="1-30" />
			</UFormField>

			<UFormField label="Owner Name">
				<UInput v-model="form.contact.name" placeholder="Owner's name" />
			</UFormField>

			<UFormField label="Phone">
				<UInput v-model="form.contact.phone" placeholder="Phone number" type="tel" />
			</UFormField>

			<UFormField label="Email">
				<UInput v-model="form.contact.email" placeholder="Email address" type="email" />
			</UFormField>

			<UFormField label="WiFi Password">
				<UInput v-model="form.wifiPassword" placeholder="WiFi password" type="password" />
			</UFormField>

			<UFormField label="Parking Number">
				<UInput v-model="form.parkingNumber" placeholder="Parking spot" />
			</UFormField>

			<UButton type="submit" :loading="loading">Save Changes</UButton>
		</form>
	</UCard>
</template>