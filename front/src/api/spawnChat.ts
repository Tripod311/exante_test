import type { APIResponse } from "./config.js"
import { BaseURL } from "./config.js"

export default async function spawnChat (agentType: string): Promise<APIResponse>  {
	try {
		const response = await fetch(`${BaseURL}/agent/${agentType}/spawn`, {
			method: "POST"
		});

		if (!response.ok) throw new Error(`Request failed: ${response.status} : ${response.statusText}`);

		const data = await response.json();

		return data as APIResponse;
	} catch (err: any) {
		return {
			error: true,
			details: err.toString()
		}
	}
}