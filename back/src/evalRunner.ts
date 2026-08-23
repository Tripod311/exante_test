import path from "path"
import fs from "fs"
import { pathToFileURL } from "url";
import createProvider from "./providers/factory.js"
import type Provider from "./providers/provider.js"

interface EvalResult {
	status: "pass" | "fail" | "warning" | "error";
	details?: string;
}

interface EvalSuite {
	name: string;
	description: string;

	tests: Record<
		string,
		(
			agent: Agent,
			judge: Judge
		) => Promise<EvalResult>
	>;
}

class Judge {
	private provider: Provider;

	constructor (provider: Provider) {
		this.provider = provider;
	}
}

class EvalRunner {
	static baseEvalsDir: string = path.resolve("./evals");
	static suites: EvalSuite[] = [];

	static async loadDefaultEvals() {
		const entries = await fs.promises.readdir(
			EvalRunner.baseEvalsDir,
			{ withFileTypes: true }
		);

		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!entry.name.endsWith(".js")) continue;

			const filePath = path.join(EvalRunner.baseEvalsDir, entry.name);

			const module = await import(
				pathToFileURL(filePath).href
			);

			EvalRunner.suites.push(module.default);
		}
	}

	static async loadAgent (type: string) {

	}
}

async function loadAgent (type: string): Agent {
	
}

async function spawnJudge (provider: string): Judge {

}

async function test (type: string, judgeProvider: string) {
	await loadDefaultEvals();
}