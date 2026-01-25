<template>
	<div class="w-full space-y-12">
		<!-- Hero Skeleton -->
		<div class="relative w-full h-64 md:h-96 overflow-hidden rounded-[2.5rem]">
			<USkeleton class="w-full h-full" />
		</div>

		<div class="max-w-screen-lg mx-auto px-4 w-full">
			<!-- Title & Metadata Skeleton -->
			<div class="flex flex-col gap-6 mb-12">
				<div class="space-y-4">
					<USkeleton class="h-8 w-48" />
					<USkeleton class="h-16 md:h-24 w-full" />
					<USkeleton class="h-16 md:h-24 w-2/3" />
				</div>
				<div class="flex gap-4 items-center">
					<USkeleton class="h-5 w-32" />
					<USkeleton class="h-8 w-20 rounded-full" />
					<USkeleton class="h-8 w-20 rounded-full" />
				</div>
			</div>

			<!-- Body Content Skeleton -->
			<div class="space-y-6 max-w-prose mx-auto">
				<USkeleton class="h-4 w-full" />
				<USkeleton class="h-4 w-full" />
				<USkeleton class="h-4 w-4/5" />
				<div class="py-8">
					<USkeleton class="h-64 w-full rounded-2xl" />
				</div>
				<USkeleton class="h-4 w-full" />
				<USkeleton class="h-4 w-11/12" />
				<USkeleton class="h-4 w-full" />
			</div>
		</div>
	</div>
</template>
