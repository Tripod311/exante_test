function AgentMessage({ content }: { content: string }) {
	return (
		<div className="flex justify-start">
			<div className="max-w-[75%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800">
				{content}
			</div>
		</div>
	);
}

function UserMessage({ content }: { content: string }) {
	return (
		<div className="flex justify-end">
			<div className="max-w-[75%] rounded-2xl rounded-br-md bg-gray-900 px-4 py-3 text-sm leading-6 text-white">
				{content}
			</div>
		</div>
	);
}

function TypingMessage() {
	return (
		<div className="flex justify-start" role="status" aria-label="Agent is typing">
			<div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
				{[0, 1, 2].map((index) => (
					<span
						key={index}
						className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
						style={{
							animationDelay: `${index * 150}ms`,
							animationDuration: "800ms"
						}}
					/>
				))}

				<span className="ml-1 text-sm text-gray-500">
					Typing…
				</span>
			</div>
		</div>
	);
}

function SystemMessage({ content }: { content: string }) {
	return (
		<div
			className="flex justify-center"
		>
			<div
				className={`max-w-[75%] rounded-xl border px-4 py-2 text-center text-sm leading-5 border-gray-200 bg-gray-50 text-gray-500`}
			>
				{content}
			</div>
		</div>
	);
}

function ErrorMessage({ content }: { content: string }) {
	return (
		<div
			className="flex justify-center"
		>
			<div
				className={`max-w-[75%] rounded-xl border px-4 py-2 text-center text-sm leading-5 border-red-200 bg-red-50 text-black`}
			>
				{content}
			</div>
		</div>
	);
}

export {
	AgentMessage,
	UserMessage,
	TypingMessage,
	SystemMessage,
	ErrorMessage
}