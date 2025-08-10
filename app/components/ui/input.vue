<template>
	<div class="flex flex-col-reverse bg-white dark:bg-neutral-800 m-0 rounded-lg h-fit">
		<input
			:id="label"
			:type="type"
			v-model="value"
			:data-filled="value.length > 0"
			autocomplete="off"
			class="w-full rounded-md py-3 px-4 text-sm peer border border-neutral-600" />
		<label
			ref="labelObject"
			:for="label"
			class="text-xs mx-2 translate-y-9 mb-1 w-fit px-1 transition-transform duration-200 ease-in-out peer-focus:translate-y-3 peer-data-[filled=true]:translate-y-3 bg-inherit"
			>{{ label }}</label
		>
	</div>
</template>
<script lang="ts" setup>
import type { InputTypeHTMLAttribute } from "vue";
const labelObject: Ref<HTMLLabelElement | null> = ref(null);
const value: Ref<any> = defineModel();

defineProps<{
	type: InputTypeHTMLAttribute;
	label: string;
}>();
</script>
