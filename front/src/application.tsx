import { useState, useEffect } from "react"
import type { ReactNode } from "react"

import spawnChat from "./api/spawnChat.js"
import getAgents from "./api/getAgents.js"
import type APIResponse from "./api/config.js"

import Spinner from "./components/spinner.jsx"
import AgentSelector from "./components/agentSelector.jsx"

export default function Application () {
	const [ loading, setLoading ] = useState<boolean>(true);
	const [ error, setError ] = useState<string | null>(null);
	const [ selectedAgent, setSelectedAgent ] = useState<string | null>(null);
	const [ agents, setAgents ] = useState<string[]>([]);

	useEffect(() => {
		getAgents().then(
			(response: APIResponse) => {
				setLoading(false);

				if (response.error) {
					setError(response.details);
				} else {
					setAgents(response.data);
				}
			}
		);
	}, []);

	const onAgentSelected = async (type: string) => {
		setLoading(true);

		const response = await spawnChat(type);
	}

	let content: ReactNode;

	if (loading) {
		content = <Spinner />;
	} else {
		if (error !== null) {
			content = <h1>An error occurred:<br/>{error}</h1>
		} else {
			content = <AgentSelector
				onSelect={onAgentSelected}
				agents={agents}
			/>
		}
	}

	return (
		<main className="w-full h-full overflow-hidden">
			{ content }
		</main>
	)
}