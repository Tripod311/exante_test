import type { APIResponse } from "./config.js"
import { BaseURL } from "./config.js"

export default async function getReport (id: string): Promise<APIResponse>  {
	try {
		const response = await fetch(`${BaseURL}/chat/${id}/report`);

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