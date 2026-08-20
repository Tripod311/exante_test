export default abstract class Provider {
    protected configuration: ProviderConfiguration;
    constructor(conf: ProviderConfiguration);
    abstract request(req: ProviderRequest): Promise<string>;
}
//# sourceMappingURL=provider.d.ts.map