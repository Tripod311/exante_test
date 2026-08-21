declare global {
	interface ApplicationConfiguration {
		client_dir: string;
		port: number;
		providers: Record<string, ProviderConfiguration>;
		agents_dir: string;
		reports_dir: string;
	}

	interface ProviderConfiguration {
		baseURL: string;
		apiKey: string;
		model: string;
		maxIterations?: number;
		maxTokens?: number;
		headers?: Record<string, string>;
		params?: Record<string, string>;
	}

	interface AgentConfiguration {
		provider: string;
		timeout: number;
		temperature?: number;
		topP?: number;
	}

	interface Message {
		role: "system" | "user" | "assistant" | "tool";
		content: string | null;
		tool_call_id?: string;
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
		temperature?: number;
		topP?: number;
	}

	export interface APIResponse {
		error: boolean;
		details?: string;
		data?: unknown;
	}
}

export {}