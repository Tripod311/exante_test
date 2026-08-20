import path from "path";
import fs from "fs";
import Agent from "./agent.js";
export default async function loadAgent(providers, agent_dir, agent_type) {
    const agentsDir = path.resolve(agent_dir);
    const agentPath = path.resolve(agentsDir, agent_type);
    const relative = path.relative(agentsDir, agentPath);
    if (relative.startsWith("..") ||
        path.isAbsolute(relative)) {
        throw new Error(`Invalid agent path: ${agent_type}`);
    }
    const confPath = path.resolve(agentPath, "configuration.json");
    const analyzerPath = path.resolve(agentPath, "analyzer.md");
    const rolePath = path.resolve(agentPath, "role.md");
    let configuration;
    let analyzer;
    let role;
    try {
        const data = await fs.promises.readFile(confPath, "utf-8");
        configuration = JSON.parse(data);
    }
    catch (err) {
        throw new Error(`Agent ${agent_type} error, corrupted configuration file: ${err}`);
    }
    try {
        analyzer = await fs.promises.readFile(analyzerPath, "utf-8");
    }
    catch (err) {
        throw new Error(`Agent ${agent_type} error, corrupted analyzer file: ${err}`);
    }
    try {
        role = await fs.promises.readFile(rolePath, "utf-8");
    }
    catch (err) {
        throw new Error(`Agent ${agent_type} error, corrupted role file: ${err}`);
    }
    const provider = providers[configuration.provider];
    if (provider === undefined) {
        throw new Error(`Agent ${agent_type} error, provider ${configuration.provider} not found`);
    }
    return new Agent(configuration, analyzer, role, provider);
}
//# sourceMappingURL=loader.js.map