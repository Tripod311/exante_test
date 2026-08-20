import Analyzer from "./analyzer.js";
import Customer from "./customer.js";
export default class Agent {
    conf;
    analyzer;
    customer;
    constructor(conf, analyzer, role, provider) {
        this.conf = conf;
        this.analyzer = new Analyzer(analyzer, provider);
        this.customer = new Customer(role, provider, conf.timeout, conf.temperature, conf.topP);
    }
}
//# sourceMappingURL=agent.js.map