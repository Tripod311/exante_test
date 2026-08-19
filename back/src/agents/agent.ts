import type Provider from "../providers/provider.js"

export default class Agent {
	private conf: AgentConfiguration;
	private analysis: string;
	private role: string;
	private provider: Provider;

	private history: string[];

	constructor (conf: AgentConfiguration, analysis: string, role: string, provider: Provider) {
		this.conf = conf;
		this.analysis = analysis;
		this.role = role;
		this.provider = Provider;
	}

	async sendMessage (message: string): Promise<string> {

	}

	async generateReport (): Promise<string> {
		
	}
}