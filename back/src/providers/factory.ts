import Provider from "./provider.js"
import DeepSeekProvider from "./deepSeek.js"

export default function createProvider (type: string, configuration: ProviderConfiguration): Provider {
	switch (type) {
	case "deepSeek":
		return new DeepSeekProvider(configuration);
	// case "openAI":
	// 	break;
	// case "anthropic":
	// 	break;
	// case "llama.cpp":
	// 	break;
	default:
		throw new Error(`Unknown provider type ${type}`);
	}
}