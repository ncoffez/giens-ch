<template>
	<div class="relative" ref="alignmentGroupRef">
		<button @click="toggle" :title="activeAlignmentTitle" :class="{ 'is-active': !!activeAlignment }">
			<TiptapChevronOverlay>
				<IconsLucideAlignCenter v-if="activeAlignment === 'center'" />
				<IconsLucideAlignRight v-else-if="activeAlignment === 'right'" />
				<IconsLucideAlignJustify v-else-if="activeAlignment === 'justify'" />
				<IconsLucideAlignLeft v-else />
			</TiptapChevronOverlay>
		</button>

		<div
			v-if="isOpen"
			class="absolute top-full mt-1 left-0 z-10 flex items-center gap-1 p-1 bg-white rounded-md shadow-md">
			<button
				@click="setAlignment('left')"
				:class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
				title="Align left">
				<IconsLucideAlignLeft />
			</button>
			<button
				@click="setAlignment('center')"
				:class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
				title="Align center">
				<IconsLucideAlignCenter />
			</button>
			<button
				@click="setAlignment('right')"
				:class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
				title="Align right">
				<IconsLucideAlignRight />
			</button>
			<button
				@click="setAlignment('justify')"
				:class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
				title="Align justify">
				<IconsLucideAlignJustify />
			</button>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import TiptapChevronOverlay from "./ChevronOverlay.vue";
import IconsLucideAlignCenter from "../icons/LucideAlignCenter.vue";
import IconsLucideAlignRight from "../icons/LucideAlignRight.vue";
import IconsLucideAlignJustify from "../icons/LucideAlignJustify.vue";
import IconsLucideAlignLeft from "../icons/LucideAlignLeft.vue";

const props = defineProps({
	editor: {
		type: Object,
		required: true,
	},
});

const emit = defineEmits(["opened"]);
const isOpen = ref(false);
const alignmentGroupRef = ref(null);

const activeAlignment = computed(() => {
	if (!props.editor) return null;
	if (props.editor.isActive({ textAlign: "center" })) return "center";
	if (props.editor.isActive({ textAlign: "right" })) return "right";
	if (props.editor.isActive({ textAlign: "justify" })) return "justify";
	if (props.editor.isActive({ textAlign: "left" })) return "left";
	return null;
});

const activeAlignmentTitle = computed(() => {
	if (!activeAlignment.value) return "Align left";
	return `Align ${activeAlignment.value.charAt(0).toUpperCase() + activeAlignment.value.slice(1)}`;
});

const toggle = () => {
	const willOpen = !isOpen.value;
	isOpen.value = willOpen;
	if (willOpen) {
		emit("opened");
	}
};

const setAlignment = (alignment) => {
	props.editor.chain().focus().setTextAlign(alignment).run();
	isOpen.value = false;
};

const handleClickOutside = (event) => {
	if (alignmentGroupRef.value && !alignmentGroupRef.value.contains(event.target)) {
		isOpen.value = false;
	}
};

const close = () => {
	isOpen.value = false;
};

defineExpose({
	close,
});

onMounted(() => {
	document.addEventListener("click", handleClickOutside, true);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside, true);
});
</script>

<style scoped>
@reference "@/assets/main.css";

.toggle-button {
	display: flex;
	align-items: center;
}

.chevron {
	width: 0.75rem;
	height: 0.75rem;
	margin-left: 0.25rem;
}

button {
	@apply bg-transparent text-gray-700 hover:bg-gray-200 m-0;
}
</style>
