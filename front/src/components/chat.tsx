import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type APIResponse from "../api/config.js"
import loadChatState from "../api/loadChatState.js"
import startDialog from "../api/startDialog.js"
import finishDialog from "../api/finishDialog.js"
import sendMessage from "../api/sendMessage.js"

interface Message {
	role: "agent" | "user";
	content: string;
}

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

	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [started, setStarted] = useState(false);
	const [finished, setFinished] = useState(false);
	const [agentName, setAgentName] = useState("");

	useEffect(() => {
		window.showSpinner();

		loadChatState(chatId).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, () => {
						window.closeModals();
						navigate("/");
					});
				} else {
					setMessages(response.data.history as Message[]);
					setStarted(response.data.started);
					setFinished(response.data.finished);
					setAgentName(response.data.type);
				}
			}
		);
	}, []);

	function send() {
		const content = input.trim();

		if (!content) {
			return;
		}

		window.showSpinner();

		sendMessage(chatId, content).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, window.closeModals);
				} else {
					if (response.data.finished) {
						if (response.data.response) {
							setMessages(prev => [
								...prev,
								{
									role: "user",
									content: content
								},
								{
									role: "assistant",
									content: `%${response.data.response}\n\n\n-- THIS CONVERSATION IS FINISHED, CLICK FINISH DIALOG BUTTON TO PROCEED TO THE REPORT WHEN YOU ARE READY --`
								}
							]);
							setInput("");	
						} else {
							setFinished(true);
						}
					} else {
						setMessages(prev => [
							...prev,
							{
								role: "user",
								content: content
							},
							{
								role: "assistant",
								content: response.data.response
							}
						]);
						setInput("");
					}
				}
			}
		);
	}

	function start () {
		window.showSpinner();

		startDialog(chatId).then(
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

		finishDialog(chatId).then(
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
						{messages.map((message, index) =>
							message.role === "assistant" ? (
								<AgentMessage
									key={message.index}
									content={message.content}
								/>
							) : (
								<UserMessage
									key={message.index}
									content={message.content}
								/>
							)
						)}
					</div>
				</div>

				<div className="border-t border-gray-200 bg-white p-4">
					<div className="mx-auto flex w-full max-w-3xl gap-3">
						<textarea
							value={input}
							onChange={event => setInput(event.target.value)}
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