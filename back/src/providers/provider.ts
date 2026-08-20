export default abstract class Provider {
	protected configuration: ProviderConfiguration;

	constructor (conf: ProviderConfiguration) {
		this.configuration = conf;
	}

	abstract request (req: ProviderRequest): Promise<string>;
}