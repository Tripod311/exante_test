import type Provider from "../providers/provider.js";
export default class Customer {
    private provider;
    private prompt;
    private history;
    started: boolean;
    finished: boolean;
    private temperature?;
    private topP?;
    private timeout;
    private timeoutID?;
    constructor(prompt: string, provider: Provider, timeout: number, temperature?: number, topP?: number);
    startDialog(): void;
    stopDialog(): void;
    processMessage(message: string): Promise<APIResponse>;
    get state(): {
        started: boolean;
        finished: boolean;
        history: Message[];
    };
}
//# sourceMappingURL=customer.d.ts.map