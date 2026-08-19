import path from "path"
import fs from "fs"
import express from "express"
import type { Request, Response } from "express"
import ProviderFactory from "./providers/factory.js"
import AgentLoader from "./agentLoader.js"

class API {
	private config: ApplicationConfiguration;
	private instance: ReturnType<typeof express>;
	private providers: Record<string, Provider> = {};
	private agents: Record<string, Agent> = {};

	private server?: ReturnType<typeof this.instance.listen>;

	constructor (config: ApplicationConfiguration) {
		this.config = config;
		this.instance = express();

		this.attachHandlers();
		this.createProviders(config.providers);
	}

	attachHandlers () {
		this.instance.use(express.json());

		this.instance.get("/api/agent/:agentName", this.instantiateAgent.bind(this));
		this.instance.post("/api/agent/:instanceId/message", this.processMessage.bind(this));

		this.instance.use(express.static(this.config.client_dir));

		this.instance.use((req, res) => {
			res.sendFile(path.join(this.config.client_dir, "index.html"));
		});
	}

	createProviders (providers: ApplicationConfiguration.providers) {
		for (const providerName in providers) {
			try {
				this.providers[providerName] = ProviderFactory.create(providerName, providers[providerName]);
			} catch (err: any) {
				console.error(err);
			}
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

	instantiateAgent (req: Request, res: Response) {

	}

	processMessage (req: Request, res: Response) {

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