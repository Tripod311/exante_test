import Provider from "./provider.js"

interface LlamaToolDescription {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	}
}

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
		messages.unshift({
			role: "system",
			content: req.systemPrompt
		});
		let tools_to_send: LlamaToolDescription[] = [];
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

			const msg = response.choices[0]!.message;

			messages.push(msg);

			if (msg.tool_calls && msg.tool_calls.length > 0) {
				for (const call of msg.tool_calls) {
					try {
						const result = await this.callTool(req.tools as ProviderToolDescription[], call.function.name, JSON.parse(call.function.arguments));
						messages.push({
							role: "tool",
							tool_call_id: call.id,
							content: JSON.stringify(result)
						});
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
					throw new Error(`Llama returned no content`);
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
		tools?: LlamaToolDescription[],
		temperature?: number,
		topP?: number,
		maxTokens?: number
	): Promise<LlamaResponse> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json"
		};
		if (this.configuration.headers) {
			for (const name in this.configuration.headers) {
				headers[name] = this.configuration.headers[name] as string;
			}
		}
		const params: Record<string, unknown> = {
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
				`Llama API error ${response.status}: ${await response.text()}`
			);
		}

		return await response.json() as LlamaResponse;
	}
}