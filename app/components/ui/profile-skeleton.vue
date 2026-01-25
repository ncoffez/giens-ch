<template>
	<div class="max-w-screen-xl mx-auto w-full space-y-8">
		<!-- Header Skeleton -->
		<div class="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
			<USkeleton class="h-24 w-24 rounded-full" />
			<div class="flex-1 space-y-4 text-center md:text-left">
				<div class="space-y-2">
					<USkeleton class="h-8 w-[200px] mx-auto md:mx-0" />
					<USkeleton class="h-4 w-[250px] mx-auto md:mx-0" />
				</div>
				<div class="flex flex-wrap justify-center md:justify-start gap-2">
					<USkeleton class="h-6 w-20 rounded-full" v-for="i in 3" :key="i" />
				</div>
			</div>
		</div>

		<!-- Settings Grid Skeleton -->
		<div class="grid md:grid-cols-2 gap-8">
			<UCard v-for="i in 2" :key="i" class="rounded-2xl border-gray-100 dark:border-gray-800">
				<template #header>
					<div class="flex items-center gap-3">
						<USkeleton class="h-6 w-6 rounded-full" />
						<USkeleton class="h-7 w-[180px]" />
					</div>
				</template>
				<div class="space-y-6">
					<div v-for="j in 3" :key="j" class="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
						<USkeleton class="h-5 w-[120px]" />
						<USkeleton class="h-6 w-[140px]" />
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>
