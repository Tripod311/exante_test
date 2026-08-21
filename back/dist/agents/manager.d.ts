import type Provider from "../providers/provider.js";
import Agent from "./agent.js";
export default class AgentManager {
    private static reports_dir;
    private static agents_dir;
    static reports: Set<string>;
    static chats: Record<string, Agent>;
    static listAgents(): Promise<string[]>;
    static spawnAgent(providers: Record<string, Provider>, agent_type: string): Promise<string>;
    static startDialog(id: string): void;
    static finishDialog(id: string): void;
    static loadState(id: string): {
        started: boolean;
        finished: boolean;
        history: Message[];
    };
    static processMessage(id: string, message: string): Promise<string>;
    static getReport(id: string): Promise<void>;
    static setup(reports_dir: string, agents_dir: string): Promise<void>;
}
//# sourceMappingURL=manager.d.ts.map