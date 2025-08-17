<script lang="ts" setup>
import { doc, updateDoc } from "firebase/firestore";

const { $db } = useNuxtApp();
const { data: labels, status } = await useFetch("/api/labels");
console.log({ labels: labels.value });
const updateLabel = async (id: string, privacyLevel: boolean) => {
	await updateDoc(doc($db, `labels/${id}`), { private: privacyLevel });
};
</script>

<template>
	<div class="mt-6">
		<USwitch
			:label="label.name"
			v-for="label of labels"
			:default-value="label.private"
			:description="label.id"
			class="my-4 place-items-center"
			:key="label.id"
			@click="updateLabel(label.id, !label.private)"></USwitch>
	</div>
</template>

<style scoped></style>
