import Provider from "./provider.js";
import DeepSeekProvider from "./deepSeek.js";
import LlamaProvider from "./llama.js";
export default function createProvider(type, configuration) {
    switch (type) {
        case "deepSeek":
            return new DeepSeekProvider(configuration);
        case "llama":
            return new LlamaProvider(configuration);
        // case "openAI":
        // 	break;
        // case "anthropic":
        // 	break;
        default:
            throw new Error(`Unknown provider type ${type}`);
    }
}
//# sourceMappingURL=factory.js.map