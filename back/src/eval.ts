import path from "path"
import fs from "fs"
import { pathToFileURL } from "url";
import createProvider from "./providers/factory.js"
import type Provider from "./providers/provider.js"
import Agent from "./agents/agent.js"
import Judge from "./agents/judge.js"

class EvalRunner {
	static applicationConfiguration?: ApplicationConfiguration;
	static baseEvalsDir: string = path.resolve("./evals");
	static suites: EvalSuite[] = [];
	static agent?: Agent;
	static judge?: Judge;

	static async loadDefaultEvals() {
		const entries = await fs.promises.readdir(
			EvalRunner.baseEvalsDir,
			{ withFileTypes: true }
		);

		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!entry.name.endsWith(".js")) continue;

			const filePath = path.join(EvalRunner.baseEvalsDir, entry.name);

			const mod = await import(
				pathToFileURL(filePath).href
			);

			EvalRunner.suites.push(mod.default);
		}
	}

	static async loadAgentEvals (type: string) {
		const fullPath = path.resolve(EvalRunner.applicationConfiguration!.agents_dir, type, "evals");

		if (!fs.existsSync(fullPath)) {
			console.log("No agent-specific evals found");
			return;
		}

		const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!entry.name.endsWith(".js")) continue;

			const filePath = path.join(fullPath, entry.name);

			const mod = await import(
				pathToFileURL(filePath).href
			);

			EvalRunner.suites.push(mod.default);
		}
	}

	static async loadAgent (type: string) {
		const fullPath = path.resolve(EvalRunner.applicationConfiguration!.agents_dir, type);

		if (!fs.existsSync(fullPath)) throw new Error(`Agent ${type} not found`);

		const promptPath = path.resolve(fullPath, "role.md");
		const confPath = path.resolve(fullPath, "configuration.json");

		let role: string;
		let configuration: AgentConfiguration;

		try {
			role = await fs.promises.readFile(promptPath, "utf-8");
		} catch (err: any) {
			throw new Error(`Error on reading role: ${err.toString()}`);
		}

		try {
			const data = await fs.promises.readFile(confPath, "utf-8");
			configuration = JSON.parse(data);
		} catch (err: any) {
			throw new Error(`Error on reading configuration: ${err.toString()}`);
		}

		const providerType = configuration.provider;

		if (EvalRunner.applicationConfiguration!.providers[providerType] === undefined) throw new Error(`Provider ${providerType} is not defined`);
		const provider = await createProvider(EvalRunner.applicationConfiguration!.providers[providerType]);

		EvalRunner.agent = new Agent(
			configuration,
			type,
			role,
			provider,
			async (data: ReportData) => {}
		);
	}

	static async spawnJudge (providerType: string) {
		if (EvalRunner.applicationConfiguration!.providers[providerType] === undefined) throw new Error(`Provider ${providerType} is not defined`);
		const provider = await createProvider(EvalRunner.applicationConfiguration!.providers[providerType]);

		EvalRunner.judge = new Judge(provider);
	}

	static async runEvals(): Promise<EvalSuiteResult[]> {
		const final: EvalSuiteResult[] = [];

		const overall = {
			total: 0,
			passed: 0,
			failed: 0,
			warnings: 0,
			errors: 0
		};

		for (const suite of EvalRunner.suites) {
			const total = Object.keys(suite.tests).length;

			const suiteResult: EvalSuiteResult = {
				name: suite.name,
				description: suite.description,

				result: {
					total,
					passed: 0,
					failed: 0,
					warnings: 0,
					errors: 0,
					tests: {}
				}
			};

			console.log(`\nRunning suite ${suite.name}`);

			for (const testName in suite.tests) {
				console.log(`Running test ${suite.name}->${testName}`);

				EvalRunner.agent!.reset();

				const func = suite.tests[testName] as (agent: Agent, judge: Judge) => Promise<EvalResult>;

				try {
					const funcResult = await func(
						EvalRunner.agent as Agent,
						EvalRunner.judge as Judge
					);

					if (!funcResult || !funcResult.status) {
						throw new Error(
							`Function ${suite.name}->${testName} returned no status`
						);
					}

					switch (funcResult.status) {
						case "pass":
							suiteResult.result.passed++;
							break;

						case "fail":
							suiteResult.result.failed++;
							break;

						case "warning":
							suiteResult.result.warnings++;
							break;

						case "error":
							suiteResult.result.errors++;
							break;

						default:
							throw new Error(
								`Function ${suite.name}->${testName} returned invalid status ${(funcResult as any).status}`
							);
					}

					suiteResult.result.tests[testName] = funcResult;

					console.log(
						`Test result: ${funcResult.status.toUpperCase()}`
						+ (funcResult.details
							? ` — ${funcResult.details}`
							: "")
					);
				} catch (err: any) {
					const result: EvalResult = {
						status: "error",
						details: `Execution failed: ${err.toString()}`
					};

					suiteResult.result.errors++;
					suiteResult.result.tests[testName] = result;

					console.log(
						`Test result: ERROR — ${result.details}`
					);
				}
			}

			console.log(`\nSuite ${suite.name} finished, status:`);
			console.log(`passed:   ${suiteResult.result.passed}/${total}`);
			console.log(`failed:   ${suiteResult.result.failed}/${total}`);
			console.log(`warnings: ${suiteResult.result.warnings}/${total}`);
			console.log(`errors:   ${suiteResult.result.errors}/${total}`);

			overall.total += total;
			overall.passed += suiteResult.result.passed;
			overall.failed += suiteResult.result.failed;
			overall.warnings += suiteResult.result.warnings;
			overall.errors += suiteResult.result.errors;

			final.push(suiteResult);
		}

		console.log("\nOverall result:");
		console.log(`passed:   ${overall.passed}/${overall.total}`);
		console.log(`failed:   ${overall.failed}/${overall.total}`);
		console.log(`warnings: ${overall.warnings}/${overall.total}`);
		console.log(`errors:   ${overall.errors}/${overall.total}`);

		return final;
	}

	static async saveResult (
		agentType: string,
		result: EvalSuiteResult[]
	) {
		const dirPath = path.resolve(
			EvalRunner.applicationConfiguration!.agents_dir,
			agentType,
			"regressions"
		);

		await fs.promises.mkdir(dirPath, {
			recursive: true
		});

		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-");

		const filePath = path.join(
			dirPath,
			`${timestamp}.json`
		);

		await fs.promises.writeFile(
			filePath,
			JSON.stringify(result, null, 2),
			"utf8"
		);

		console.log(`Regression result saved to ${filePath}`);
	}
}

async function runTests () {
	const appConfigRaw = await fs.promises.readFile("./configuration.json", "utf-8");
	EvalRunner.applicationConfiguration = JSON.parse(appConfigRaw) as ApplicationConfiguration;

	const agentType = process.argv[2];
	const judgeProvider = EvalRunner.applicationConfiguration.judge_provider;

	await EvalRunner.loadDefaultEvals();
	await EvalRunner.loadAgent(agentType as string);
	await EvalRunner.spawnJudge(judgeProvider as string);
	await EvalRunner.loadAgentEvals(agentType as string);
	const result = await EvalRunner.runEvals();
	// write to regressions dir
	await EvalRunner.saveResult(agentType as string, result);
}

runTests().then(() => {
	process.exit(0);
}, (err: any) => {
	console.error(err);
	process.exit(1);
});