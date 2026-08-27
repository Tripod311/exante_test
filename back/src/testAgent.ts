import path from "path"
import fs from "fs"
import { pathToFileURL } from "url";

import { validateConfig, Ripple } from "@tripod311/ripple"
import type { EvalTarget, RippleConfiguration, JudgeInput } from "@tripod311/ripple"

import createProvider from "./providers/factory.js"
import type Provider from "./providers/provider.js"
import Agent from "./agents/agent.js"
import Judge from "./agents/judge.js"
import type { CustomerState } from "./tools/customerState/tool.js"

let rippleConf: RippleConfiguration;
let config: any;
let agentType: string;
let agentConf: any;
let agentRole: string;

let llm_calls: number = 0;

async function spawnTarget () {
	const providerType = agentConf.provider;
	const provider = await createProvider(config.providers[providerType]);

	const agent = new Agent(
		agentConf,
		agentType,
		agentRole,
		provider,
		async (data: ReportData) => {}
	);
	// reset sets started to trun
	agent.reset();

	// manually set fingerprint
	rippleConf.fingerprint = agent.prompt_hash;

	return {
		async send(input: string): Promise<string> {
			llm_calls++;
			const result = await agent.processMessage(input);

			return result.response;
		},

		async reset(): Promise<void> {
			agent.reset();
		},

		async dispose(): Promise<void> {
			// do nothing, provider is in-memory and dies with application
		},

		async snapshot(): Promise<{ customerState: CustomerState; history: Message[]; }> {
			return {
				customerState: (agent as any).customerState.result,
				history: (agent as any).history
			}
		}
	}
}

async function spawnJudge () {
	const provider = await createProvider(config.providers[config.judge_provider]);

	const judge = new Judge(provider, agentRole);

	return {
		async evaluate(input: JudgeInput) {
			llm_calls++;
			// push history in metadata
			return await judge.generateJudgement(input.criteria, input.metadata!.history as Message[]);
		},

		async dispose () {
			// do nothing, provider is in-memory and dies with application
		}
	}
}

async function beforeAll (conf: RippleConfiguration) {
	const configRaw = await fs.promises.readFile("./configuration.json", "utf-8");
	config = JSON.parse(configRaw);

	agentType = process.argv[2] as string;
	// agentType = "Daniel";
	agentConf = JSON.parse(await fs.promises.readFile(`${config.agents_dir}/${agentType}/configuration.json`, "utf-8"));
	agentRole = await fs.promises.readFile(`${config.agents_dir}/${agentType}/role.md`, "utf-8");

	conf.execution.in.push(`${config.agents_dir}/${agentType}/evals/*.js`);
	conf.execution.out = `${config.agents_dir}/${agentType}/regressions`;
}

rippleConf = validateConfig({
	targetFactory: spawnTarget,
	judgeFactory: spawnJudge,

	execution: {
		in: [
			"./evals/*.js"
		],
		timeout: 30000,
		retries: 3
	},

	hooks: {
		beforeAll
	}
});

const ripple = new Ripple(rippleConf);

ripple.run().then(() => {
	console.log(`\n\n\nLLM CALLS: ${llm_calls}`);
	process.exit(0);
}, (err: any) => {
	console.error(err);
});