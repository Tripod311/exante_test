import path from "path"
import fs from "fs"
import express from "express"
import type { Request, Response } from "express"
import AgentLoader from "./agentLoader.js"
import createProvider from "./providers/factory,js"
import type Provider from "./providers/provider.js"

class API {
	private config: ApplicationConfiguration;
	private instance: ReturnType<typeof express>;
	private providers: Record<string, Provider> = {};

	private counter: number = 0;
	private agents: Record<number, Agent> = {};

	private server?: ReturnType<typeof this.instance.listen>;

	constructor (config: ApplicationConfiguration) {
		this.config = config;
		this.instance = express();

		this.attachHandlers();
		this.createProviders();
	}

	attachHandlers () {
		this.instance.use(express.json());

		this.instance.post("/api/agent/:id/spawn", this.spawnAgent.bind(this));
		this.instance.post("/api/chat/:id/start", this.startDialog.bind(this));
		this.instance.post("/api/chat/:id/end", this.endDialog.bind(this));
		this.instance.get("/api/chat/:id/history", this.loadState.bind(this));
		this.instance.post("/api/chat/:id/message", this.processMessage.bind(this));
		this.instance.get("/api/chat/:id/report", this.generateReport.bind(this));

		this.instance.use(express.static(this.config.client_dir));

		this.instance.use((req, res) => {
			res.sendFile(path.join(this.config.client_dir, "index.html"));
		});
	}

	createProviders () {
		for (const name in this.config.providers) {
			this.providers[name] = createProvider(name, this.config.providers[name]);
		}
	}

	start () {
		const server = this.instance.listen(this.config.port, () => {
			console.log(`Listening on ${this.config.port}`);
		});
	}

	async stop(): Promise<void> {
		if (!this.server) return;

		const server = this.server;

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				server.closeAllConnections();
			}, 5000);

			server.close(err => {
				clearTimeout(timeout);

				if (err) {
					reject(err);
					return;
				}

				resolve();
			});

			server.closeIdleConnections();
		});
	}

	// API

	async spawnAgent (req: Request, res: Response) {
		const id = this.counter++;

		try {
			const agent = await loadAgent(this.providers, this.config.agents_dir, req.params.id);

			this.agents[id] = agent;

			res.json({
				error: false,
				data: id
			});
		} catch (err: any) {
			res.json({
				error: true,
				details: err
			});
		}
	}

	startDialog (req: Request, res: Response) {

	}

	endDialog (req: Request, res: Response) {

	}

	loadState (req: Request, res: Response) {

	}

	async processMessage (req: Request, res: Response) {

	}

	async generateReport (req: Request, res: Response) {

	}
}

let config: ApplicationConfiguration;

try {
	const file = fs.readFileSync("./configuration.json", "utf-8");
	config = JSON.parse(file);
} catch (err: any) {
	console.error(`Startup error: ${err}`);
	process.exit(1);
}

const api = new API(config);

let shuttingDown = false;

async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;

	try {
		await api.stop();
		process.exit(0);
	} catch (err) {
		console.error("Shutdown error:", err);
		process.exit(1);
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

api.start();