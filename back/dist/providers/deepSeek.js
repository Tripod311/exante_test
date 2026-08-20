import Provider from "./provider.js";
export default class DeepSeekProvider extends Provider {
    async request(req) {
        let iterations = 0;
        const messages = req.messages.slice();
        let tools_to_send = [];
        if (req.tools) {
            tools_to_send = req.tools.map(t => {
                return {
                    type: "function",
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters
                    }
                };
            });
        }
        while (true) {
            iterations++;
            const response = await this.send(this.configuration.model, messages, tools_to_send, req.temperature, req.topP, this.configuration.maxTokens);
            if (this.configuration.maxIterations !== undefined && iterations === this.configuration.maxIterations) {
                throw new Error("Max iterations exceeded");
            }
            if (response.choices.length === 0) {
                throw new Error(`DeepSeek returned no content`);
            }
            const msg = response.choices[0].message;
            messages.push(msg);
            if (msg.tool_calls && msg.tool_calls.length > 0) {
                for (const call of msg.tool_calls) {
                    try {
                        const result = await this.callTool(req.tools, call.function.name, JSON.parse(call.function.arguments));
                        messages.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: JSON.stringify(result)
                        });
                    }
                    catch (err) {
                        console.warn(`Tool call error: ${err}`);
                        messages.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: `Tool call error: ${err}`
                        });
                    }
                }
            }
            else {
                // actually finished
                const content = msg.content;
                if (!content) {
                    throw new Error(`DeepSeek returned no content`);
                }
                else {
                    return content;
                }
            }
        }
    }
    async callTool(tools, name, args) {
        for (const desc of tools) {
            if (desc.name === name) {
                return await desc.call(args);
            }
        }
        throw new Error(`Tool ${name} not found`);
    }
    async send(model, messages, tools, temperature, topP, maxTokens) {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.configuration.apiKey}`
        };
        if (this.configuration.headers) {
            for (const name in this.configuration.headers) {
                headers[name] = this.configuration.headers[name];
            }
        }
        const params = {
            model,
            messages,
            tools,
            temperature,
            top_p: topP,
            max_tokens: maxTokens
        };
        if (this.configuration.params) {
            for (const name in this.configuration.params) {
                params[name] = this.configuration.params[name];
            }
        }
        const response = await fetch(this.configuration.baseURL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            throw new Error(`DeepSeek API error ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    }
}
//# sourceMappingURL=deepSeek.js.map