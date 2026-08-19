export default abstract class Provider {
	private configuration: ProviderConfiguration;

	constructor (conf: ProviderConfiguration) {
		this.configuration = conf;
	}

	abstract request (req: ProviderRequest): Promise<string>;
}