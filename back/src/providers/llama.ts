import Provider from "./provider.js"

interface LlamaResponse {
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

export default class LlamaProvider extends Provider {
	async request(req: ProviderRequest): Promise<string> {
		let iterations = 0;
		const messages = req.messages.slice();
		let tools_to_send = [];
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

		while (true) {
			iterations++;

			const response = await this.send(
				this.configuration.model,
				messages,
				tools_to_send,
				req.temperature,
				req.topP,
				this.configuration.maxTokens
			);

			if (this.configuration.maxIterations !== undefined && iterations === this.configuration.maxIterations) {
				throw new Error("Max iterations exceeded");
			}

			if (response.choices.length === 0) {
				throw new Error(`Llama returned no content`);
			}

			const msg = response.choices[0].message;

			messages.push(msg);

			if (msg.tool_calls && msg.tool_calls.length > 0) {
				for (const call of msg.tool_calls) {
					try {
						const result = await this.callTool(req.tools, call.function.name, JSON.parse(call.function.arguments));
						messages.push({
							role: "tool",
							tool_call_id: toolCall.id,
							content: JSON.stringify(result)
						});
					} catch (err: any) {
						console.warn(`Tool call error: ${err}`);
						messages.push({
							role: "tool",
							tool_call_id: toolCall.id,
							content: `Tool call error: ${err}`
						});
					}
				}
			} else {
				// actually finished
				const content = msg.content;
				return content
			}
		}
	}

	private async callTool (tools: ProviderToolDescription[], name: string, arguments: Record<string, unknown>): Promise<unknown> {
		for (const desc of tools) {
			if (desc.name === name) {
				return await desc.call(arguments);
			}
		}

		throw new Error(`Tool ${name} not found`);
	}

	private async send (
		model: string,
		messages: Message[],
		tools?: Partial<ProviderToolDescription>[],
		temperature?: number,
		topP?: number,
		maxTokens?: number
	): Promise<DeepSeekResponse> {
		const headers = {
			"Content-Type": "application/json"
		};
		if (this.configuration.headers) {
			for (const name in this.configuration.headers) {
				headers[name] = this.configuration.headers[name];
			}
		}
		const params = {
			messages,
			tools,
			temperature,
			top_p: topP,
			max_tokens: maxTokens
		};
		if (this.configuration.params) {
			for (const name in this.configuration.params) {
				params[name] = this.configuration.params[name];
			}
		}

		const response = await fetch(this.configuration.baseURL, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(params)
		});

		if (!response.ok) {
			throw new Error(
				`DeepSeek API error ${response.status}: ${await response.text()}`
			);
		}

		return await response.json() as DeepSeekResponse;
	}
}