export default function Spinner() {
	return (
		<div className="flex w-full h-full items-center justify-center bg-white">
			<div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
		</div>
	);
}