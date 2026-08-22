import type Provider from "../providers/provider.js"
import update_customer_state_description from "../tools/customerState/description.js"
import update_customer_state_modifier from "../tools/customerState/modifier.js"
import CustomerState from "../tools/customerState/tool.js"

export default class Agent {
	private provider: Provider;
	private agent_type: string;
	private conf: AgentConfiguration;
	private prompt: string;
	private tools: ProviderToolDescription[] = [];
	private finishFunc: (data: ReportData) => void;

	private customerState: CustomerState;
	private history: Message[] = [];

	public started: boolean = false;
	public finished: boolean = false;
	private timeoutID?: ReturnType<typeof setTimeout>;
	private messagePromise?: Promise<string>;

	constructor (
		conf: AgentConfiguration,
		agent_type: string,
		prompt: string,
		provider: Provider,
		finishFunc: (data: ReportData) => void
	) {
		this.conf = conf;
		this.agent_type = agent_type;
		this.prompt = `${prompt}\n${update_customer_state_modifier}`;
		this.provider = provider;
		this.customerState = new CustomerState(this.conf.initialState);
		this.tools.push({
			...update_customer_state_description,
			call: this.customerState.update.bind(this.customerState)
		});
		this.finishFunc = finishFunc;
	}

	startDialog () {
		if (!this.started) {
			this.started = true;
			this.timeoutID = setTimeout(this.finishDialog.bind(this), this.conf.timeout * 60 * 1000);
		}
	}

	async finishDialog () {
		if (this.started && !this.finished) {
			if (this.messagePromise !== undefined) {
				try {
					await this.messagePromise;
				} catch (err: any) {
					// do nothing
				}
			}

			clearTimeout(this.timeoutID);
			this.started = false;
			this.finished = true;

			// generate report
			this.finalize();
		}
	}

	finalize () {
		const initialState = Object.assign({}, this.conf.initialState);
		const finalState = this.customerState.result;
		const delta: Record<string, number> = {};

		for (const param in finalState) {
			const initial = (initialState as any)[param] ?? 0;
			const final = (finalState as any)[param] as number;

			delta[param] = final - initial;
		}

		const impactEvents = this.customerState.evolution.slice();
		const processedConversation: ReportMessageData[] = [];

		for (let i=0; i<this.history.length; i++) {
			if (impactEvents[0] !== undefined && impactEvents[0].index === i) {
				const ev = impactEvents.shift();

				processedConversation.push({
					role: this.history[i]!.role,
					content: this.history[i]!.content as string,
					impact: ev!.impact
				});
			} else {
				processedConversation.push({
					role: this.history[i]!.role,
					content: this.history[i]!.content as string
				});
			}
		}

		this.finishFunc({
			agent_type: this.agent_type,
			role: this.prompt,
			initialState: initialState,
			finalState: finalState,
			stateDelta: delta,
			conversation: processedConversation
		});
	}

	async processMessage (message: string): Promise<string> {
		this.messagePromise = this.send(message);

		const result = await this.messagePromise;

		this.messagePromise = undefined;

		return result;
	}

	private async send (message: string): Promise<string> {
		this.customerState.reset();
		this.customerState.index = this.history.length;

		const history = this.history.map(m => JSON.stringify(m)).join('\n');

		const response = await this.provider.request({
			systemPrompt: this.prompt,
			messages: [
				{
					role: "system",
					content: `Conversation history:\n${history}`
				},
				{
					role: "user",
					content: message
				}
			],
			tools: this.tools,
			temperature: this.conf.temperature,
			topP: this.conf.topP
		});
		this.history.push({
			role: "user",
			content: message
		});
		this.history.push({
			role: "assistant",
			content: response
		});
		this.customerState.commit();

		return response;
	}

	get state () {
		return {
			started: this.started,
			finished: this.finished,
			history: this.history
		}
	}
}