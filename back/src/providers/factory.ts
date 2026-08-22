import Provider from "./provider.js"
import OpenAIProvider from "./openAI.js"

export default function createProvider (configuration: ProviderConfiguration): Provider {
	switch (configuration.type) {
	case "openAI":
		return new OpenAIProvider(configuration);
	default:
		throw new Error(`Unknown provider type ${configuration.type}`);
	}
}