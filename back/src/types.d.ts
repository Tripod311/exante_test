declare global {
	interface ApplicationConfiguration {
		client_dir: string;
		port: number;
		providers: Record<string, ProviderConfiguration>;
		agents_dir: string;
		reports_dir: string;
		report_provider: string;
		judge_provider: string;
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
		requiredTool?: string;
		finishOnToolCall?: string[];
		temperature?: number;
		topP?: number;
	}

	interface APIResponse {
		error: boolean;
		details?: string;
		data?: unknown;
	}
	
	interface EvalResult {
		status: "pass" | "fail" | "warning" | "error";
		details?: string;
	}

	interface MultiEvalResult {
		status: "pass" | "fail" | "warning" | "error";
		agreement: number;
		results: EvalResult[];
	}

	type EvalTestRunner = (
		agent: Agent,
		judge: Judge
	) => Promise<EvalResult>;

	type EvalTest = EvalTestRunner | { run: EvalTestRunner, trials: number; };

	interface EvalSuite {
		name: string;
		description: string;

		tests: Record<string, EvalTest>;
	}

	interface EvalSuiteResult {
		name: string;
		description: string;
		result: {
			total: number;
			passed: number;
			warnings: number;
			failed: number;
			errors: number;
			tests: Record<string, EvalResult | MultiEvalResult>
		}
	}

	interface AgentEvalResult {
		agent_type: string;
		agent_configuration: AgentConfiguration;
		prompt_hash: string;
		results: EvalSuiteResult[];
	}

	export interface ReportMessageData {
		role: "user" | "assistant";
		content: string;
		impact?: CustomerState;
	}

	export type ReportArea =
		| "customer_understanding"
		| "communication_quality"
		| "trust_building"
		| "product_knowledge"
		| "objection_handling"
		| "missed_opportunities"
		| "next_steps";

	export interface ReportEvidence {
		messageIndex: number;
		quote: string;
		explanation: string;
	}

	export interface ReportAreaResult {
		score: 1 | 2 | 3 | 4 | 5;
		summary: string;
		evidence: ReportEvidence[];
		recommendation: string;
	}

	export interface ReportResult {
		schemaVersion: 1;
		overallSummary: string;
		areas: Record<ReportArea, ReportAreaResult>;
	}

	export interface ReportData {
		role: string;
		initialState: CustomerState;
		finalState: CustomerState;
		stateDelta: CustomerState;
		conversation: ReportMessageData[];
		result?: ReportResult;

		agent_type: string;
		agent_configuration: AgentConfiguration;
		prompt_hash: string;
	}
}

export {}