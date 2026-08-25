const allowed_status = ["pass", "fail", "warning"];

export default class SubmitJudgementTool {
	public lastResult?: EvalResult;

	async submit (args: Record<string, unknown>) {
		if (!args.status ||
			!(allowed_status.includes(args.status as string)) ||
			!args.details) {
			throw new Error(`Invalid input ${args}`);
		}

		this.lastResult = args as unknown as EvalResult;

		return "Submitted succesfully";
	}
}