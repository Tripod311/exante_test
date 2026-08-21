import type { APIResponse } from "./config.js"
import { BaseURL } from "./config.js"

export default async function loadChatState (id: string): Promise<APIResponse>  {
	try {
		const response = await fetch(`${BaseURL}/chat/${id}/state`);

		if (!response.ok) throw new Error(`Request failed: ${response.statusCode} : ${response.status}`);

		const data = await response.json();

		return data as APIResponse;
	} catch (err: any) {
		return {
			error: true,
			details: err.toString()
		}
	}
}