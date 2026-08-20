import type Provider from "../providers/provider.js"
import Analyzer from "./analyzer.js"
import Customer from "./customer.js"

export default class Agent {
	private conf: AgentConfiguration;
	public analyzer: Analyzer;
	public customer: Customer;

	constructor (conf: AgentConfiguration, analysis: string, role: string, provider: Provider) {
		this.conf = conf;
		this.analyzer = new Analyzer(analysis, provider);
		this.customer = new Customer(
			role,
			provider,
			conf.timeout,
			conf.temperature,
			conf.topP
		);
	}
}