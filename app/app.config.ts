export default defineAppConfig({
	ui: {
		colors: {
			primary: "blue",
			neutral: "stone",
		},
		card: {
			slots: {
				root: "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800",
			},
		},
		navigationMenu: {
			slots: {
				viewportWrapper: "z-20",
			},
		},
	},
});
