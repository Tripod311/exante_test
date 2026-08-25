interface NotificationDialogProps {
	heading: string | undefined;
	message: string | undefined;
	onClose: (() => void) | undefined;
}

export default function NotificationDialog(props: NotificationDialogProps) {
	return (
		<div className="relative flex w-[90%] max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
			<button
				onClick={props.onClose}
				className="
					absolute right-4 top-3
					text-xl text-gray-400
					transition hover:text-gray-700
				"
				aria-label="Close"
			>
				×
			</button>

			<div className="border-b border-gray-100 px-6 py-4">
				<h2 className="text-lg font-semibold text-gray-900">
					{props.heading}
				</h2>
			</div>

			<div className="max-h-[50vh] overflow-y-auto px-6 py-5">
				<p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
					{props.message}
				</p>
			</div>
		</div>
	);
}