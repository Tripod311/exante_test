import type Provider from "../providers/provider.js"

export default class Customer {
	private provider: Provider;
	private prompt: string;
	private history: Message[] = [];
	public started: boolean = false;
	public finished: boolean = false;

	private temperature?: number
	private topP?: number;

	private timeout: number;
	private timeoutID?: ReturnType<typeof setTimeout>;

	constructor (
		prompt: string,
		provider: Provider,
		timeout: number,
		temperature?: number,
		topP?: number
	) {
		this.prompt = prompt;
		this.provider = provider;
		this.timeout = timeout;
		this.temperature = temperature;
		this.topP = topP;
	}

	startDialog () {
		this.started = true;
		this.timeoutID = setTimeout(this.stopDialog.bind(this), this.timeout);
	}

	stopDialog () {
		clearTimeout(this.timeoutID);
		this.started = false;
		this.finished = true;
	}

	async processMessage (message: string): APIResponse {
		const history = this.history.map(m => JSON.stringify(m)).join('\n');

		try {
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
				temperature: this.temperature,
				topP: this.topP
			});
			this.history.push({
				role: "user",
				content: message
			});
			this.history.push({
				role: "assistant",
				content: response
			});

			return {
				error: false,
				data: response
			}
		} catch (err: any) {
			console.warn(`Chat error: ${err}`);

			return {
				error: true,
				details: err.toString()
			}
		}
	}
}