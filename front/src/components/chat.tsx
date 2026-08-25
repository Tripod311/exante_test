import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { APIResponse } from "../api/config.js"
import loadChatState from "../api/loadChatState.js"
import getRemainingTime from "../api/getRemainingTime.js"
import startDialog from "../api/startDialog.js"
import finishDialog from "../api/finishDialog.js"
import sendMessage from "../api/sendMessage.js"

import { AgentMessage, UserMessage, TypingMessage, SystemMessage, ErrorMessage } from "./chatMessages.jsx"
import Timer from "./chatTimer.jsx"

interface Message {
	role: "assistant" | "user" | "system";
	content: string;
	systemType?: "placeholder" | "error" | "notification";
}

interface ChatStateResponse {
	history: Message[];
	started: boolean;
	finished: boolean;
	type: string;
	remainingTime: number;
}

interface SendMessageResponse {
	finished: boolean;
	remainingTime: number;
	response: string;
}

interface ChatPlaceholderProps {
	agentName: string;
	heading: string;
	message: string;
	buttonText: string;
	action: () => void;
}

function ChatPlaceholder(props: ChatPlaceholderProps) {
	return (
		<div className="flex h-full w-full flex-col bg-gray-50">
			<header className="border-b border-gray-200 bg-white px-6 py-4">
				<h1 className="text-lg font-semibold text-gray-900">
					Chat with { props.agentName }
				</h1>
			</header>

			<div className="flex min-h-0 flex-1 items-center justify-center p-6">
				<div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
					<h2 className="text-xl font-semibold text-gray-900">
						{ props.heading }
					</h2>

					<p className="mt-2 text-sm leading-6 text-gray-500">
						{ props.message }
					</p>

					<button
						onClick={props.action}
						className="
							mt-6 rounded-xl bg-gray-900
							px-6 py-3
							text-sm font-medium text-white
							transition
							hover:bg-gray-700
							active:scale-[0.98]
						"
					>
						{ props.buttonText }
					</button>
				</div>
			</div>
		</div>
	);
}

export default function Chat() {
	const { chatId } = useParams();
	const navigate = useNavigate();
	const chatRef = useRef<HTMLDivElement>(null);

	const [pending, setPending] = useState<boolean>(true);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [started, setStarted] = useState(false);
	const [finished, setFinished] = useState(false);
	const [agentName, setAgentName] = useState("");
	const [remainingTime, setRemainingTime] = useState(0);

	useEffect(() => {
		window.showSpinner();

		loadChatState(chatId as string).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, () => {
						window.closeModals();
						navigate("/");
					});
				} else {
					const data = response.data as ChatStateResponse; 

					setPending(false);
					setMessages(data.history as Message[]);
					setStarted(data.started);
					setFinished(data.finished);
					setAgentName(data.type);
					setRemainingTime(data.remainingTime);
				}
			}
		);
	}, []);

	useEffect(() => {
		if (!started || finished) {
			return;
		}

		let cancelled = false;
		let timeoutID: number | undefined;

		async function synchronizeTimer() {
			try {
				const response = await getRemainingTime(
					chatId as string
				);

				if (cancelled || response.error) {
					return;
				}

				const data = response.data as {
					remainingTime: number;
					finished: boolean;
				};

				setRemainingTime(data.remaining);

				if (data.finished) {
					setFinished(true);
				}
			} finally {
				if (!cancelled) {
					timeoutID = window.setTimeout(
						synchronizeTimer,
						10_000
					);
				}
			}
		}

		timeoutID = window.setTimeout(
			synchronizeTimer,
			10_000
		);

		return () => {
			cancelled = true;

			if (timeoutID !== undefined) {
				window.clearTimeout(timeoutID);
			}
		};
	}, [chatId, started, finished]);

	function send() {
		const content = input.trim();

		if (!content) {
			return;
		}

		setPending(true);

		setMessages(prev => [
			...prev,
			{
				role: "user",
				content: content
			},
			{
				role: "system",
				systemType: "placeholder",
				content: ""
			},

		])

		setInput("");

		sendMessage(chatId as string, content).then(
			(response: APIResponse) => {
				window.closeModals();

				setPending(false);

				if (response.error) {
					setMessages(prev => [
						...(prev.slice(0, prev.length - 2)),
						{
							role: "system",
							systemType: "error",
							content: response.details as string
						}
					]);
				} else {
					const data = response.data as SendMessageResponse;

					if (data.finished) {
						if (data.response) {
							setMessages(prev => [
								...(prev.slice(0, prev.length - 1)),					
								{
									role: "assistant",
									content: `data.response`
								},
								{
									role: "system",
									systemType: "notification",
									content: `This conversation is over. Click "Finish dialog" button to proceed to report`
								}
							]);
						} else {
							setFinished(true);
						}
					} else {
						setRemainingTime(data.remainingTime);
						setMessages(prev => [
							...(prev.slice(0, prev.length - 1)),
							{
								role: "assistant",
								content: data.response
							}
						]);
					}
				}
			}
		);
	}

	function start () {
		window.showSpinner();

		startDialog(chatId as string).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, window.closeModals);
				} else {
					setStarted(true);
				}
			}
		);
	}

	function finish () {
		window.showSpinner();

		finishDialog(chatId as string).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, window.closeModals);
				} else {
					setStarted(false);
					setFinished(true);
				}
			}
		);
	}

	function scrollToBottom() {
		chatRef.current?.scrollTo({
			top: chatRef.current.scrollHeight,
			behavior: "smooth"
		});
	}

	useEffect(scrollToBottom, [ messages ]);

	function getReport () {
		navigate(`/${chatId}/report`);
	}

	if (!started && !finished) {
		return <ChatPlaceholder
			action={start}
			agentName={agentName}
			heading="Session is not started yet"
			message="Start the dialog when you are ready."
			buttonText="Start dialog"
		/>
	} else if (finished) {
		return <ChatPlaceholder
			action={getReport}
			agentName={agentName}
			heading="Session is over"
			message="Click the button below to see the results"
			buttonText="Show results"
		/>
	} else {
		return (
			<div className="flex h-full w-full flex-col bg-gray-50">
				<header className="border-b border-gray-200 bg-white px-6 py-4 flex flex-row justify-between">
					<h1 className="text-lg font-semibold text-gray-900">
						Chat with {agentName}
					</h1>

					<Timer
						remainingTime={remainingTime}
						started={started}
						onDeadline={() => {
							setMessages(previous => [
								...previous,
								{
									role: "system",
									systemType: "notification",
									content: "Time is over. New messages cannot be sent."
								}
							]);

							setFinished(true);
						}}
					/>

					<button
						onClick={finish}
						className="
							rounded-lg border border-slate-200
							bg-white px-4 py-2
							text-sm font-medium text-slate-600
							transition
							hover:bg-slate-50
							active:scale-[0.98]
						"
					>
						Finish dialog
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto" ref={chatRef}>
					<div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
						{
							messages.map((message, index) => {
								switch (message.role) {
								case 'assistant':
									return <AgentMessage
										key={index}
										content={message.content}
									/>
								case "user":
									return <UserMessage
										key={index}
										content={message.content}
									/>
								case "system":
									if (message.systemType === "placeholder") {
										return <TypingMessage key={index} />
									} else if (message.systemType === "error") {
										return <ErrorMessage
											key={index}
											content={message.content}
										/>
									} else {
										return <SystemMessage
											key={index}
											content={message.content}
										/>
									}
								default:
									return null;
								}
							})
						}
					</div>
				</div>

				<div className="border-t border-gray-200 bg-white p-4">
					<div className="mx-auto flex w-full max-w-3xl gap-3">
						<textarea
							value={input}
							onChange={event => setInput(event.target.value)}
							onKeyDown={event => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									send();
								}
							}}
							placeholder="Type your message..."
							rows={2}
							className="
								min-h-[52px] flex-1 resize-none
								rounded-xl border border-gray-300
								px-4 py-3 text-sm
								outline-none transition
								focus:border-gray-500
							"
						/>

						<button
							onClick={send}
							className="
								self-end rounded-xl bg-gray-900
								px-5 py-3 text-sm font-medium text-white
								transition hover:bg-gray-700
							"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		);
	}
}