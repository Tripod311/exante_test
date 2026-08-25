import Provider from "./provider.js"

interface OpenAIToolDescription {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	}
}

interface OpenAIForcedTool {
	type: "function";
	function: {
		name: string;
	};
}

interface OpenAIResponse {
	id: string;
	object: string;
	created: number;
	model: string;

	choices: {
		index: number;

		message: {
			role: "assistant";
			content: string | null;

			tool_calls?: {
				id: string;
				type: "function";
				function: {
					name: string;
					arguments: string;
				};
			}[];
		};

		finish_reason:
			| "stop"
			| "length"
			| "tool_calls"
			| "content_filter"
			| null;
	}[];

	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;

		prompt_cache_hit_tokens?: number;
		prompt_cache_miss_tokens?: number;
	};
}

export default class OpenAIProvider extends Provider {
	async request(req: ProviderRequest): Promise<string> {
		let iterations = 0;
		const messages = req.messages.slice();
		messages.unshift({
			role: "system",
			content: req.systemPrompt
		});
		let tools_to_send: OpenAIToolDescription[] = [];
		if (req.tools) {
			tools_to_send = req.tools.map(t => {
				return {
					type: "function",
					function: {
						name: t.name,
						description: t.description,
						parameters: t.parameters
					}
				}
			});
		}
		let requiredTool: OpenAIForcedTool | undefined = undefined;
		if (req.requiredTool) {
			requiredTool = {
				type: "function",
				function: {
					name: req.requiredTool
				}
			}
		}

		while (true) {
			iterations++;

			const response = await this.send(
				this.configuration.model,
				messages,
				tools_to_send,
				requiredTool,
				req.temperature,
				req.topP,
				this.configuration.maxTokens
			);

			if (this.configuration.maxIterations !== undefined && iterations === this.configuration.maxIterations) {
				throw new Error("Max iterations exceeded");
			}

			if (response.choices.length === 0) {
				throw new Error(`OpenAI returned no content`);
			}

			const msg = response.choices[0]!.message;
			msg.content = msg.content ?? "";
			messages.push(msg);

			if (msg.tool_calls && msg.tool_calls.length > 0) {
				for (const call of msg.tool_calls) {
					if (requiredTool !== undefined && call.function.name === requiredTool.function.name) {
						requiredTool = undefined;
					}

					try {
						const result = await this.callTool(req.tools as ProviderToolDescription[], call.function.name, JSON.parse(call.function.arguments));
						messages.push({
							role: "tool",
							tool_call_id: call.id,
							content: JSON.stringify(result)
						});

						if (req.finishOnToolCall && req.finishOnToolCall.includes(call.function.name)) {
							return "";
						}
					} catch (err: any) {
						console.warn(`Tool call error: ${err}`);
						messages.push({
							role: "tool",
							tool_call_id: call.id,
							content: `Tool call error: ${err}`
						});
					}
				}
			} else {
				// actually finished
				const content = msg.content;

				if (!content) {
					throw new Error(`OpenAI returned no content`);
				} else {
					return content as string;
				}
			}
		}
	}

	private async callTool (tools: ProviderToolDescription[], name: string, args: Record<string, unknown>): Promise<unknown> {
		for (const desc of tools) {
			if (desc.name === name) {
				return await desc.call(args);
			}
		}

		throw new Error(`Tool ${name} not found`);
	}

	private async send (
		model: string,
		messages: Message[],
		tools?: OpenAIToolDescription[],
		requiredTool?: OpenAIForcedTool,
		temperature?: number,
		topP?: number,
		maxTokens?: number
	): Promise<OpenAIResponse> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json"
		};

		if (this.configuration.apiKey !== undefined) {
			headers["Authorization"] = `Bearer ${this.configuration.apiKey}`;
		}

		if (this.configuration.headers) {
			for (const name in this.configuration.headers) {
				headers[name] = this.configuration.headers[name] as string;
			}
		}

		const params: Record<string, unknown> = {
			model,
			messages,
			tools,
			temperature,
			top_p: topP,
			max_tokens: maxTokens
		};

		if (requiredTool !== undefined) {
			params.tool_choice = requiredTool;
		}

		if (this.configuration.params) {
			for (const name in this.configuration.params) {
				params[name] = this.configuration.params[name];
			}
		}

		const maxRetries = 3;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			const response = await fetch(this.configuration.baseURL, {
				method: "POST",
				headers,
				body: JSON.stringify(params)
			});

			if (response.ok) {
				return await response.json() as OpenAIResponse;
			}

			if (response.status === 429 && attempt < maxRetries) {
				const retryAfter = response.headers.get("retry-after");

				const delay = retryAfter
					? Number(retryAfter) * 1000
					: 1000 * 2 ** attempt;

				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}

			throw new Error(
				`OpenAI API error ${response.status}: ${await response.text()}`
			);
		}

		throw new Error(`OpenAI API request failed after ${maxRetries} retries`);
	}
}