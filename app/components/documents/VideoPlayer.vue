<script setup lang="ts">
import type { GlobalFile } from "../../../types";

const props = defineProps<{
	video: GlobalFile;
}>();

const emit = defineEmits<{
	close: [];
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);

const downloadVideo = () => {
	if (props.video.url) {
		window.open(props.video.url, "_blank");
	}
};

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === "Escape") {
		emit("close");
	}
	if (e.key === " " && videoRef.value) {
		e.preventDefault();
		if (videoRef.value.paused) {
			videoRef.value.play();
		} else {
			videoRef.value.pause();
		}
	}
};

onMounted(() => {
	document.addEventListener("keydown", handleKeydown);
	document.body.style.overflow = "hidden";
	
	if (videoRef.value) {
		videoRef.value.play().catch(() => {
			// Autoplay might be blocked
		});
	}
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	document.body.style.overflow = "";
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
					<span class="text-white/80 text-sm font-medium truncate max-w-xs">
						{{ video.name }}
					</span>
					<button
						class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2 transition-colors"
						@click="downloadVideo"
					>
						<UIcon name="i-lucide-download" class="w-4 h-4" />
						Download
					</button>
				</div>
			</div>

			<div
				class="flex-1 flex items-center justify-center p-4"
				@click.stop
			>
				<video
					ref="videoRef"
					:src="video.url"
					controls
					autoplay
					class="max-w-full max-h-full rounded-lg shadow-2xl"
					@play="isPlaying = true"
					@pause="isPlaying = false"
				>
					Ihr Browser unterstützt das Video-Tag nicht.
				</video>
			</div>

			<div class="bg-black/50 px-4 py-3 flex items-center justify-center" @click.stop>
				<p class="text-white/60 text-xs">
					Leertaste zum Pausieren • ESC zum Schliessen
				</p>
			</div>
		</div>
	</Teleport>
</template>
