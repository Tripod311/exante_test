import path from "path"
import type Provider from "../providers/provider.js"
import Agent from "./agent.js"

export default function loadAgent (
	providers: Record<string, Provider>,
	agent_dir: string,
	agent_type: string
): Agent {

}