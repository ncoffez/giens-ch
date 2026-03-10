<script setup lang="ts">
import type { GlobalFile } from "../../../types";

const props = defineProps<{
	images: GlobalFile[];
	initialIndex: number;
}>();

const emit = defineEmits<{
	close: [];
}>();

const currentIndex = ref(props.initialIndex);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const imageRef = ref<HTMLImageElement | null>(null);

const currentImage = computed(() => props.images[currentIndex.value]);

const hasNext = computed(() => currentIndex.value < props.images.length - 1);
const hasPrev = computed(() => currentIndex.value > 0);

const goToNext = () => {
	if (hasNext.value) {
		currentIndex.value++;
		resetZoom();
	}
};

const goToPrev = () => {
	if (hasPrev.value) {
		currentIndex.value--;
		resetZoom();
	}
};

const goToImage = (index: number) => {
	currentIndex.value = index;
	resetZoom();
};

const resetZoom = () => {
	zoom.value = 1;
	panX.value = 0;
	panY.value = 0;
};

const handleZoom = (delta: number) => {
	const newZoom = Math.max(1, Math.min(5, zoom.value + delta));
	
	if (newZoom === 1) {
		panX.value = 0;
		panY.value = 0;
	}
	
	zoom.value = newZoom;
};

const handleWheel = (e: WheelEvent) => {
	e.preventDefault();
	handleZoom(e.deltaY > 0 ? -0.3 : 0.3);
};

const handleMouseDown = (e: MouseEvent) => {
	if (zoom.value > 1) {
		isDragging.value = true;
		dragStartX.value = e.clientX - panX.value;
		dragStartY.value = e.clientY - panY.value;
	}
};

const handleMouseMove = (e: MouseEvent) => {
	if (isDragging.value && zoom.value > 1) {
		panX.value = e.clientX - dragStartX.value;
		panY.value = e.clientY - dragStartY.value;
	}
};

const handleMouseUp = () => {
	isDragging.value = false;
};

const handleKeydown = (e: KeyboardEvent) => {
	switch (e.key) {
		case "ArrowRight":
			goToNext();
			break;
		case "ArrowLeft":
			goToPrev();
			break;
		case "Escape":
			emit("close");
			break;
		case "+":
		case "=":
			handleZoom(0.3);
			break;
		case "-":
			handleZoom(-0.3);
			break;
		case "0":
			resetZoom();
			break;
	}
};

const downloadImage = () => {
	if (currentImage.value?.url) {
		window.open(currentImage.value.url, "_blank");
	}
};

onMounted(() => {
	document.addEventListener("keydown", handleKeydown);
	document.body.style.overflow = "hidden";
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	document.body.style.overflow = "";
});

watch(() => props.initialIndex, (newIndex) => {
	currentIndex.value = newIndex;
	resetZoom();
});
</script>

<template>
	<Teleport to="body">
		<div
			class="fixed inset-0 z-50 bg-black/95 flex flex-col"
			@click="emit('close')"
		>
			<div class="flex items-center justify-between px-4 py-3 bg-black/50" @click.stop>
				<button
					class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
					@click="emit('close')"
				>
					<UIcon name="i-lucide-x" class="w-6 h-6 text-white" />
				</button>
				
				<div class="flex items-center gap-4">
					<span class="text-white/80 text-sm font-medium">
						{{ currentIndex + 1 }} / {{ images.length }}
					</span>
					<button
						class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2 transition-colors"
						@click="downloadImage"
					>
						<UIcon name="i-lucide-download" class="w-4 h-4" />
						Download
					</button>
				</div>
			</div>

			<div
				class="flex-1 flex items-center justify-center relative overflow-hidden"
				@wheel="handleWheel"
				@mousedown="handleMouseDown"
				@mousemove="handleMouseMove"
				@mouseup="handleMouseUp"
				@mouseleave="handleMouseUp"
				@click.stop
			>
				<button
					v-if="hasPrev"
					class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
					@click="goToPrev"
				>
					<UIcon name="i-lucide-chevron-left" class="w-8 h-8 text-white" />
				</button>

				<div
					class="flex items-center justify-center w-full h-full p-8"
					:style="{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }"
				>
					<img
						ref="imageRef"
						:src="currentImage?.optimizedUrl || currentImage?.url"
						:alt="currentImage?.name"
						class="max-w-full max-h-full object-contain select-none transition-transform duration-100"
						:style="{
							transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
						}"
						draggable="false"
					/>
				</div>

				<button
					v-if="hasNext"
					class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
					@click="goToNext"
				>
					<UIcon name="i-lucide-chevron-right" class="w-8 h-8 text-white" />
				</button>

				<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
					<button
						class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
						@click="handleZoom(-0.3)"
						:disabled="zoom <= 1"
						:class="{ 'opacity-30': zoom <= 1 }"
					>
						<UIcon name="i-lucide-zoom-out" class="w-5 h-5 text-white" />
					</button>
					<span class="text-white/80 text-sm font-medium min-w-[3rem] text-center">
						{{ Math.round(zoom * 100) }}%
					</span>
					<button
						class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
						@click="handleZoom(0.3)"
						:disabled="zoom >= 5"
						:class="{ 'opacity-30': zoom >= 5 }"
					>
						<UIcon name="i-lucide-zoom-in" class="w-5 h-5 text-white" />
					</button>
				</div>
			</div>

			<div class="bg-black/50 px-4 py-3" @click.stop>
				<div class="flex items-center justify-center gap-2 overflow-x-auto max-w-full py-1">
					<button
						v-for="(image, index) in images"
						:key="image.id"
						class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
						:class="index === currentIndex ? 'border-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'"
						@click="goToImage(index)"
					>
						<img
							:src="image.thumbnailUrl || image.url"
							:alt="image.name"
							class="w-full h-full object-cover"
						/>
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>
