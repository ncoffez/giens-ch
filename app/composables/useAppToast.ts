export const useAppToast = () => {
	const toast = useToast();

	const error = (title: string, description?: string) => {
		const textToCopy = description || title;
		
		return toast.add({
			title,
			description,
			color: "error",
			icon: "i-lucide-circle-alert",
			actions: [
				{
					label: "Kopieren",
					icon: "i-lucide-copy",
					color: "neutral",
					variant: "ghost",
					onClick: () => {
						navigator.clipboard.writeText(textToCopy);
					}
				}
			]
		});
	};

	const success = (title: string, description?: string) => {
		return toast.add({
			title,
			description,
			color: "success",
			icon: "i-lucide-check-circle"
		});
	};

	return {
		...toast,
		error,
		success
	};
};
