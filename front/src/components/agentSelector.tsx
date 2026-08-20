interface AgentSelectorProps {
	agents: string[];
	onSelect: (agent: string) => void;
}

export default function AgentSelector(props: AgentSelectorProps) {
	return (
		<div className="flex h-full w-full justify-center bg-white p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">
					Select agent
				</h1>

				<div className="flex flex-col gap-3">
					{props.agents.map(agent => (
						<button
							key={agent}
							className="
								w-full rounded-xl border border-gray-200
								bg-white px-5 py-4
								text-left text-base font-medium text-gray-800
								shadow-sm transition
								hover:border-gray-300 hover:bg-gray-50 hover:shadow
								active:scale-[0.99]
							"
							onClick={() => { props.onSelect(agent) }}
						>
							{agent}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}