import type Provider from "../providers/provider.js";
import Analyzer from "./analyzer.js";
import Customer from "./customer.js";
export default class Agent {
    private conf;
    analyzer: Analyzer;
    customer: Customer;
    constructor(conf: AgentConfiguration, analyzer: string, role: string, provider: Provider);
}
//# sourceMappingURL=agent.d.ts.map