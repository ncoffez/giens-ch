<template>
	<div class="app-shell mx-auto min-h-screen px-3 md:px-6">
		<header class="mx-auto flex w-full max-w-screen-lg items-center justify-between gap-4 py-4">
			<UiLogo class="pointer-events-none m-0!" />
			<UiLanguageSwitcher />
		</header>
		<main id="main-content" class="mx-auto w-full max-w-screen-lg pb-10">
			<slot />
		</main>
	</div>
</template>
