import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"

import spawnChat from "./api/spawnChat.js"
import getAgents from "./api/getAgents.js"
import type APIResponse from "./api/config.js"

import Spinner from "./components/spinner.jsx"
import Overlay from "./overlay/overlay.jsx"
import AgentSelector from "./components/agentSelector.jsx"
import Chat from "./components/chat.jsx"
import Report from "./components/report.jsx"

export default function Application () {
	const [ error, setError ] = useState<string | null>(null);
	const [ selectedAgent, setSelectedAgent ] = useState<string | null>(null);
	const [ agents, setAgents ] = useState<string[]>([]);

	useEffect(() => {
		window.showSpinner();

		getAgents().then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification(response.details);
				} else {
					setAgents(response.data);
				}
			}
		);
	}, []);

	const navigate = useNavigate();

	const onAgentSelected = async (type: string) => {
		window.showSpinner();

		const response = await spawnChat(type);

		window.closeModals();

		if (response.error) {
			window.showNotification("Error", response.details, window.closeModals);
		} else {
			navigate(`/${response.data}/chat`);
		}
	}

	return (
		<main className="w-full h-full overflow-hidden">
			<Routes>
				<Route path="/" element={ <AgentSelector agents={ agents } onSelect={ onAgentSelected } /> } />
				<Route path="/:chatId/chat" element={ <Chat /> } />
				<Route path="/:chatId/report" element={ <Report /> } />
			</Routes>
			<Overlay />
		</main>
	)
}