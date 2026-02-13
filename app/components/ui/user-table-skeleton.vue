<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between pb-2">
			<USkeleton class="h-10 w-[250px]" />
			<USkeleton class="h-12 w-[160px] rounded-lg" />
		</div>
		<div class="border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden shadow-lg">
			<div class="bg-gray-50/50 dark:bg-stone-900/50 p-6 flex gap-6">
				<USkeleton v-for="i in 4" :key="i" class="h-5 flex-1" />
			</div>
			<div v-for="i in 5" :key="i" class="p-6 flex items-center gap-6 border-t border-gray-50 dark:border-stone-800">
				<div class="flex items-center gap-4 flex-1">
					<USkeleton class="h-12 w-12 rounded-full" />
					<div class="space-y-3">
						<USkeleton class="h-6 w-[150px]" />
						<USkeleton class="h-4 w-[200px]" />
					</div>
				</div>
				<USkeleton class="h-7 w-[90px] rounded-full" />
				<USkeleton class="h-5 w-[120px]" />
				<USkeleton class="h-10 w-10 rounded-md" />
			</div>
		</div>
	</div>
</template>
