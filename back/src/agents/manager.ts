import crypto from "crypto"
import path from "path"
import fs from "fs"
import type Provider from "../providers/provider.js"
import Agent from "./agent.js"
import Analyzer from "./analyzer.js"

const UUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default class AgentManager {
	private static reports_dir: string = "../reports";
	private static agents_dir: string = "../agents";
	private static report_provider?: Provider;

	static reports: Set<string> = new Set();
	static chats: Record<string, Agent> = {};
	static pending_reports: Record<string, Promise<void>> = {};

	static async listAgents (): Promise<string[]> {
		const abs = path.resolve(AgentManager.agents_dir);

		const entries = await fs.promises.readdir(abs, { withFileTypes: true });

		const folders = entries
			.filter(entry => entry.isDirectory())
			.map(entry => entry.name);

		return folders;
	}

	static async spawnAgent (
		providers: Record<string, Provider>,
		agent_type: string
	): Promise<string> {
		let id: string;

		do {
			id = crypto.randomUUID();
		} while (AgentManager.reports.has(id) || AgentManager.chats[id] !== undefined);

		const agentsDir = path.resolve(AgentManager.agents_dir);
		const agentPath = path.resolve(agentsDir, agent_type);

		const relative = path.relative(agentsDir, agentPath);

		if (
			relative.startsWith("..") ||
			path.isAbsolute(relative)
		) {
			throw new Error(`Invalid agent path: ${agent_type}`);
		}

		const confPath = path.resolve(agentPath, "configuration.json");
		const rolePath = path.resolve(agentPath, "role.md");

		let configuration: AgentConfiguration;
		let role: string;

		try {
			const data = await fs.promises.readFile(confPath, "utf-8");
			configuration = JSON.parse(data) as AgentConfiguration;
		} catch (err: any) {
			throw new Error(`Agent ${agent_type} error, corrupted configuration file: ${err}`);
		}

		try {
			role = await fs.promises.readFile(rolePath, "utf-8");
		} catch (err: any) {
			throw new Error(`Agent ${agent_type} error, corrupted role file: ${err}`);
		}

		const provider = providers[configuration.provider];

		if (provider === undefined) {
			throw new Error(`Agent ${agent_type} error, provider ${configuration.provider} not found`);
		}

		AgentManager.chats[id] = new Agent(configuration, agent_type, role, provider, AgentManager.onAgentFinished.bind({}, id));

		return id;
	}

	private static onAgentFinished (chatId: string, data: ReportData) {
		console.log(`Processing chat ${chatId} results`);
		const pr = Analyzer.generateReport(AgentManager.report_provider as Provider, data)
			.then(() => {
				return fs.promises.writeFile(`${AgentManager.reports_dir}/${chatId}.json`, JSON.stringify(data));
			})
			.then(() => {
				console.log(`Report for chat ${chatId} successfully generated`);
				delete AgentManager.pending_reports[chatId];
				AgentManager.reports.add(chatId);
				delete AgentManager.chats[chatId];
			});

		AgentManager.pending_reports[chatId] = pr;
	}

	static startDialog (id: string) {
		const chat = AgentManager.chats[id];

		if (chat === undefined) throw new Error(`Chat ${id} not found`);

		chat.startDialog();
	}

	static finishDialog (id: string) {
		const chat = AgentManager.chats[id];

		if (chat === undefined) throw new Error(`Chat ${id} not found`);

		chat.finishDialog();
	}

	static loadState (id: string) {
		const chat = AgentManager.chats[id];

		if (chat === undefined) throw new Error(`Chat ${id} not found`);

		return chat.state;
	}

	static async processMessage (id: string, message: string): Promise<{ response: string; finished: boolean; }> {
		const chat = AgentManager.chats[id];

		if (chat === undefined) throw new Error(`Chat ${id} not found`);

		if (chat.finished) throw new Error(`Chat ${id} is already finished`);
		
		return chat.processMessage(message);
	}

	static async getReport (id: string): Promise<ReportData> {
		if (!UUIDRegex.test(id)) throw new Error(`Invalid chat id: ${id}`);

		let exists = false;

		if (AgentManager.pending_reports[id]) {
			// report is generating

			exists = true;
			await AgentManager.pending_reports[id];
		} else if (AgentManager.chats[id] && AgentManager.chats[id].finished) {
			// chat is finished, but report generation failed

			exists = true;
			AgentManager.chats[id].finalize();
			await AgentManager.pending_reports[id];
		} else if (AgentManager.reports.has(id)) {
			exists = true;
		}

		if (!exists) throw new Error(`Report ${id} not found`);

		const data = await fs.promises.readFile(`${AgentManager.reports_dir}/${id}.json`, "utf-8");
		return JSON.parse(data) as ReportData;
	}

	static async setup (report_provider: Provider | undefined, reports_dir: string, agents_dir: string) {
		await fs.promises.mkdir(reports_dir, {
			recursive: true
		});

		if (!report_provider) throw new Error(`Report provider is not defined`);

		AgentManager.report_provider = report_provider;
		AgentManager.agents_dir = agents_dir;
		AgentManager.reports_dir = reports_dir;
		const fullPath = path.resolve(reports_dir);
		const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

		const reports = entries
			.filter(entry => entry.isFile())
			.filter(entry => {
				if (!entry.name.endsWith('.json')) return false;

				const withoutExt = entry.name.slice(0, entry.name.length-5);

				return UUIDRegex.test(withoutExt);
			})
			.map(entry => entry.name.slice(0, entry.name.length-5));

		AgentManager.reports = new Set(reports);
	}
}