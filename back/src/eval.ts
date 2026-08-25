import path from "path"
import fs from "fs"
import { pathToFileURL } from "url";
import createProvider from "./providers/factory.js"
import type Provider from "./providers/provider.js"
import Agent from "./agents/agent.js"
import Judge from "./agents/judge.js"

type EvalStatus = EvalResult["status"];

class EvalRunner {
	static applicationConfiguration?: ApplicationConfiguration;
	static baseEvalsDir: string = path.resolve("./evals");
	static suites: EvalSuite[] = [];
	static agent: Agent | null = null;
	static judge: Judge | null = null;

	static async runEvals(): Promise<AgentEvalResult> {
		if (!EvalRunner.agent) {
			throw new Error("EvalRunner agent is not initialized");
		}

		if (!EvalRunner.judge) {
			throw new Error("EvalRunner judge is not initialized");
		}

		const startedAt = Date.now();
		const results: EvalSuiteResult[] = [];

		console.log(`Starting eval run: ${EvalRunner.suites.length} suite(s)`);

		for (let index = 0; index < EvalRunner.suites.length; index++) {
			const suite = EvalRunner.suites[index];

			console.log(
				`\n[Suite ${index + 1}/${EvalRunner.suites.length}] ${suite!.name}`
			);

			const result = await EvalRunner.runSuite(
				suite as EvalSuite,
				EvalRunner.agent,
				EvalRunner.judge
			);

			results.push(result);
		}

		const overall = results.reduce(
			(total, suite) => {
				total.tests += suite.result.total;
				total.passed += suite.result.passed;
				total.failed += suite.result.failed;
				total.warnings += suite.result.warnings;
				total.errors += suite.result.errors;

				return total;
			},
			{
				tests: 0,
				passed: 0,
				failed: 0,
				warnings: 0,
				errors: 0
			}
		);

		console.log("\nEval run completed");
		console.log(`Suites:   ${results.length}`);
		console.log(`Tests:    ${overall.tests}`);
		console.log(`Passed:   ${overall.passed}`);
		console.log(`Failed:   ${overall.failed}`);
		console.log(`Warnings: ${overall.warnings}`);
		console.log(`Errors:   ${overall.errors}`);
		console.log(`Duration: ${EvalRunner.formatDuration(Date.now() - startedAt)}`);

		return {
			agent_type: EvalRunner.agent.type,
			agent_configuration: EvalRunner.agent.configuration,
			prompt_hash: EvalRunner.agent.prompt_hash,
			results: results
		}
	}

	static async runSuite(
		suite: EvalSuite,
		agent: Agent,
		judge: Judge
	): Promise<EvalSuiteResult> {
		const startedAt = Date.now();
		const tests = Object.entries(suite.tests);

		const suiteResult: EvalSuiteResult = {
			name: suite.name,
			description: suite.description,
			result: {
				total: tests.length,
				passed: 0,
				failed: 0,
				warnings: 0,
				errors: 0,
				tests: {}
			}
		};

		console.log(`Description: ${suite.description}`);
		console.log(`Tests: ${tests.length}`);

		for (let index = 0; index < tests.length; index++) {
			const [testName, test] = tests[index]!;

			console.log(
				`\n  [Test ${index + 1}/${tests.length}] ${suite.name} -> ${testName}`
			);

			const result = await EvalRunner.runTest(
				test,
				agent,
				judge
			);

			suiteResult.result.tests[testName] = result;
			EvalRunner.incrementStatusCounter(suiteResult, result.status);

			const agreement =
				"agreement" in result
					? `, agreement: ${(result.agreement * 100).toFixed(0)}%`
					: "";

			console.log(
				`  Result: ${result.status.toUpperCase()}${agreement}`
			);
		}

		console.log(`\nSuite "${suite.name}" completed`);
		console.log(
			`  ${suiteResult.result.passed} passed, ` +
			`${suiteResult.result.failed} failed, ` +
			`${suiteResult.result.warnings} warnings, ` +
			`${suiteResult.result.errors} errors`
		);
		console.log(
			`  Duration: ${EvalRunner.formatDuration(Date.now() - startedAt)}`
		);

		return suiteResult;
	}

	static async runTest(
		test: EvalTest,
		agent: Agent,
		judge: Judge
	): Promise<EvalResult | MultiEvalResult> {
		const runner = typeof test === "function" ? test : test.run;
		const trials = typeof test === "function" ? 1 : test.trials;

		if (!Number.isInteger(trials) || trials < 1) {
			return {
				status: "error",
				details: `Invalid trials value: ${trials}. Expected a positive integer.`
			};
		}

		if (trials === 1) {
			console.log("  Running single trial");

			return EvalRunner.runSingleTest(runner, agent, judge);
		}

		console.log(`  Running ${trials} trials`);

		const results: EvalResult[] = [];

		for (let trial = 1; trial <= trials; trial++) {
			console.log(`    Trial ${trial}/${trials}`);

			const result = await EvalRunner.runSingleTest(
				runner,
				agent,
				judge
			);

			results.push(result);

			console.log(
				`    Trial ${trial}/${trials}: ${result.status.toUpperCase()}` +
				(result.details ? ` — ${result.details}` : "")
			);
		}

		const status = EvalRunner.getMajorityStatus(results);
		const matchingResults = results.filter(
			result => result.status === status
		).length;

		return {
			status,
			agreement: matchingResults / results.length,
			results
		};
	}

	static async runSingleTest(
		runner: EvalTestRunner,
		agent: Agent,
		judge: Judge
	): Promise<EvalResult> {
		const startedAt = Date.now();

		try {
			agent.reset();

			const result = await runner(agent, judge);

			if (!EvalRunner.isEvalResult(result)) {
				return {
					status: "error",
					details: "Test returned an invalid EvalResult"
				};
			}

			console.log(
				`    Completed in ${EvalRunner.formatDuration(Date.now() - startedAt)}`
			);

			return result;
		} catch (error) {
			const message = EvalRunner.formatError(error);

			console.error(
				`    Execution error after ` +
				`${EvalRunner.formatDuration(Date.now() - startedAt)}: ${message}`
			);

			return {
				status: "error",
				details: `Execution failed: ${message}`
			};
		}
	}

	private static getMajorityStatus(results: EvalResult[]): EvalStatus {
		const counts: Record<EvalStatus, number> = {
			pass: 0,
			warning: 0,
			fail: 0,
			error: 0
		};

		for (const result of results) {
			counts[result.status]++;
		}

		const priority: EvalStatus[] = [
			"error",
			"fail",
			"warning",
			"pass"
		];

		return priority.reduce((selected, status) => {
			return counts[status] > counts[selected]
				? status
				: selected;
		});
	}

	private static incrementStatusCounter(
		suite: EvalSuiteResult,
		status: EvalStatus
	): void {
		switch (status) {
			case "pass":
				suite.result.passed++;
				break;

			case "fail":
				suite.result.failed++;
				break;

			case "warning":
				suite.result.warnings++;
				break;

			case "error":
				suite.result.errors++;
				break;
		}
	}

	private static isEvalResult(value: unknown): value is EvalResult {
		if (!value || typeof value !== "object") {
			return false;
		}

		const status = (value as Partial<EvalResult>).status;

		return (
			status === "pass" ||
			status === "fail" ||
			status === "warning" ||
			status === "error"
		);
	}

	private static formatError(error: unknown): string {
		if (error instanceof Error) {
			return error.stack ?? error.message;
		}

		return String(error);
	}

	private static formatDuration(milliseconds: number): string {
		if (milliseconds < 1_000) {
			return `${milliseconds} ms`;
		}

		return `${(milliseconds / 1_000).toFixed(2)} s`;
	}

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

		EvalRunner.judge = new Judge(provider, EvalRunner.agent!.role);
	}

	static async saveResult (
		agentType: string,
		result: AgentEvalResult
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