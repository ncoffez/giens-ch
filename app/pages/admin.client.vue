<script setup lang="ts">
import { type User } from "firebase/auth";

definePageMeta({ middleware: "is-admin" });

const { data: users } = await useFetch<User[]>("/api/users");
const rowSelection: Ref<any> = ref({});
const selectedUsers = computed(() => {
	const selection = [];
	const keys = Object.keys(rowSelection.value);
	for (const id of keys) {
		selection.push(users.value![Number(id)]?.email);
	}
	return selection;
});

function onSelect(row: any, e?: Event) {
	row.toggleSelected(!row.getIsSelected());
}

const pick = (objects: User[] | undefined, keys: string[]) => {
	if (!objects) return [];
	return objects.map((obj) => Object.fromEntries(keys.map((key) => [key, (obj as any)[key]])));
};
</script>

<template>
	<div class="mb-4 mt-20 max-w-screen-lg mx-auto">
		<div class="flex-1">
			<UTable
				ref="table"
				class="z-0"
				v-model:row-selection="rowSelection"
				:ui="{
					tr: 'data-[selected=true]:font-bold',
				}"
				:data="pick(users, ['displayName', 'email', 'uid', 'photoURL'])"
				@select="onSelect" />
		</div>
		<div class="text-sm mt-4" v-if="selectedUsers.length > 0">
			<h2 class="text-xl font-semibold leading-loose">Selection</h2>
			<ul>
				<li v-for="user of selectedUsers">{{ user }}</li>
			</ul>
		</div>
	</div>
</template>
