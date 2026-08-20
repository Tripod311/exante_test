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
        this.started = true;
        this.timeoutID = setTimeout(this.stopDialog.bind(this), this.timeout);
    }
    stopDialog() {
        clearTimeout(this.timeoutID);
        this.started = false;
        this.finished = true;
    }
    async processMessage(message) {
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
            };
        }
        catch (err) {
            console.warn(`Chat error: ${err}`);
            return {
                error: true,
                details: err.toString()
            };
        }
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