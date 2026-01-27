<template>
	<div class="flex flex-col md:flex-row max-w-screen-md mx-auto gap-x-8 gap-y-6 my-6 md:my-8 first:mt-5 items-stretch w-full bg-white dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse md:min-h-[220px]">
		<!-- Image Skeleton -->
		<USkeleton
			class="md:w-56 w-full h-48 md:h-auto rounded-xl flex-shrink-0" />
		
		<!-- Content Skeleton -->
		<div class="flex flex-col items-start gap-3 flex-1 py-1">
			<div class="flex gap-3 items-center">
				<USkeleton class="h-3 w-20" />
				<USkeleton class="h-4 w-12 rounded-md" />
			</div>
			
			<div class="space-y-3 w-full flex-1">
				<USkeleton class="h-6 w-3/4" />
				<div class="space-y-2">
					<USkeleton class="h-4 w-full" />
					<USkeleton class="h-4 w-5/6" />
				</div>
			</div>
			
			<div class="mt-auto pt-4 flex justify-between items-center w-full border-t border-gray-50 dark:border-gray-800/50">
				<div class="flex items-center gap-2">
					<USkeleton class="h-6 w-6 rounded-full" />
					<USkeleton class="h-4 w-20" />
				</div>
				<USkeleton class="h-4 w-12" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineProps({
	index: {
		type: Number,
		default: 0,
	},
});
</script>
