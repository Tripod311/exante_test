import crypto from "crypto";
import path from "path";
import fs from "fs";
import Agent from "./agent.js";
const UUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default class AgentManager {
    static reports_dir = "../reports";
    static agents_dir = "../agents";
    static reports = new Set();
    static chats = {};
    static async listAgents() {
        const abs = path.resolve(AgentManager.agents_dir);
        const entries = await fs.promises.readdir(abs, { withFileTypes: true });
        const folders = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
        return folders;
    }
    static async spawnAgent(providers, agent_type) {
        let id;
        do {
            id = crypto.randomUUID();
        } while (AgentManager.reports.has(id) || AgentManager.chats[id] !== undefined);
        const agentsDir = path.resolve(AgentManager.agents_dir);
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
        AgentManager.chats[id] = new Agent(configuration, analyzer, role, provider);
        return id;
    }
    static startDialog(id) {
        const chat = AgentManager.chats[id];
        if (chat === undefined)
            throw new Error(`Chat ${id} not found`);
        chat.customer.startDialog();
    }
    static finishDialog(id) {
        const chat = AgentManager.chats[id];
        if (chat === undefined)
            throw new Error(`Chat ${id} not found`);
        chat.customer.finishDialog();
    }
    static loadState(id) {
        const chat = AgentManager.chats[id];
        if (chat === undefined)
            throw new Error(`Chat ${id} not found`);
        return chat.customer.state;
    }
    static async processMessage(id, message) {
        const chat = AgentManager.chats[id];
        if (chat === undefined)
            throw new Error(`Chat ${id} not found`);
        if (chat.customer.finished)
            throw new Error(`Chat ${id} is already finished`);
        return chat.customer.processMessage(message);
    }
    static async getReport(id) {
    }
    static async setup(reports_dir, agents_dir) {
        await fs.promises.mkdir(reports_dir, {
            recursive: true
        });
        AgentManager.agents_dir = agents_dir;
        AgentManager.reports_dir = reports_dir;
        const fullPath = path.resolve(reports_dir);
        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        const reports = entries
            .filter(entry => entry.isFile())
            .map(entry => entry.name)
            .filter(entry => {
            if (!entry.endsWith('.json'))
                return false;
            const withoutExt = entry.slice(0, entry.length - 5);
            return UUIDRegex.test(withoutExt);
        });
        AgentManager.reports = new Set(reports);
    }
}
//# sourceMappingURL=manager.js.map