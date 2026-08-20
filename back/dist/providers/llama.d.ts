import Provider from "./provider.js";
export default class LlamaProvider extends Provider {
    request(req: ProviderRequest): Promise<string>;
    private callTool;
    private send;
}
//# sourceMappingURL=llama.d.ts.map