declare global {
	interface ApplicationConfiguration {
		client_dir: string;
		port: number;
		providers: Record<string, ProviderConfiguration>;
		agents_dir: string;
	}

	interface ProviderConfiguration {
		baseURL: string;
		apiKey: string;
		maxIterations?: number;
		maxTokens?: number;
		headers?: Record<string, string>;
		params?: Record<string, string>;
	}

	interface AgentConfiguration {
		provider: string;
		temperature?: number;
		topP?: number;
	}

	interface Message {
		role: "system" | "user" | "assistant" | "tool";
		content: string;
	}

	export interface ProviderToolDescription {
		name: string;
		description: string;
		parameters: Record<string, unknown>;

		call: (args: Record<string, unknown>) => Promise<unknown>;
	}

	export interface ProviderRequest {
		systemPrompt: string;
		messages: Message[];

		tools?: ProviderToolDescription[];

		model: string;
		temperature?: number;
		topP?: number;
		maxTokens?: number;
	}
}

export {}