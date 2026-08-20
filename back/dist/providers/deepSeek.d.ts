import Provider from "./provider.js";
export default class DeepSeekProvider extends Provider {
    request(req: ProviderRequest): Promise<string>;
    private callTool;
    private send;
}
//# sourceMappingURL=deepSeek.d.ts.map