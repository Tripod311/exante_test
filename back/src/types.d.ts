declare global {
	interface ApplicationConfiguration {
		client_dir: string;
		port: number;
		providers: Record<string, ProviderConfiguration>;
		agents_dir: string;
		reports_dir: string;
		report_provider: string;
	}

	interface ProviderConfiguration {
		type: string;
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
		initialState: {
			interest: number;
			trust: number;
			clarity: number;
			readiness: number;
		};
		temperature?: number;
		topP?: number;
	}

	interface Message {
		role: "system" | "user" | "assistant" | "tool";
		content: string | null;
		tool_call_id?: string;
	}

	interface ProviderToolDescription {
		name: string;
		description: string;
		parameters: Record<string, unknown>;

		call: (args: Record<string, unknown>) => Promise<unknown>;
	}

	interface ProviderRequest {
		systemPrompt: string;
		messages: Message[];
		tools?: ProviderToolDescription[];
		temperature?: number;
		topP?: number;
	}

	interface APIResponse {
		error: boolean;
		details?: string;
		data?: unknown;
	}

	type ReportMessageData = {
		role: string;
		content: string;
		impact?: CustomerState;
	}

	interface ReportData {
		agent_type: string;
		role: string;
		initialState: CustomerState;
		finalState: CustomerState;
		stateDelta: CustomerState;
		conversation: ReportMessageData[];
		result?: string;
	}
}

export {}