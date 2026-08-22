interface StateRowProps {
	label: string;
	initial: number;
	final: number;
	delta: number;
}

function StateRow({
	label,
	initial,
	final,
	delta
}: StateRowProps) {
	const deltaLabel =
		delta > 0
			? `+${delta}`
			: `${delta}`;

	return (
		<div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
			<div className="text-sm font-medium text-gray-700">
				{label}
			</div>

			<div className="flex items-center gap-3 text-sm">
				<span className="text-gray-400">
					{initial}
				</span>

				<span className="text-gray-300">
					→
				</span>

				<span className="font-semibold text-gray-900">
					{final}
				</span>

				<span
					className={
						delta > 0
							? "min-w-8 text-right font-medium text-emerald-600"
							: delta < 0
								? "min-w-8 text-right font-medium text-red-500"
								: "min-w-8 text-right text-gray-400"
					}
				>
					{deltaLabel}
				</span>
			</div>
		</div>
	);
}