export default class Customer {
    provider;
    prompt;
    history = [];
    started = false;
    finished = false;
    temperature;
    topP;
    timeout;
    timeoutID;
    constructor(prompt, provider, timeout, temperature, topP) {
        this.prompt = prompt;
        this.provider = provider;
        this.timeout = timeout;
        this.temperature = temperature;
        this.topP = topP;
    }
    startDialog() {
        if (!this.started) {
            this.started = true;
            this.timeoutID = setTimeout(this.finishDialog.bind(this), this.timeout * 60 * 1000);
        }
    }
    finishDialog() {
        if (this.started && !this.finished) {
            clearTimeout(this.timeoutID);
            this.started = false;
            this.finished = true;
        }
    }
    async processMessage(message) {
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
        return response;
    }
    get state() {
        return {
            started: this.started,
            finished: this.finished,
            history: this.history
        };
    }
}
//# sourceMappingURL=customer.js.map