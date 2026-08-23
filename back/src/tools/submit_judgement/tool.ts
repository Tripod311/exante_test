export default class Judgement {
	public lastResult?: EvalResult;

	async submit (args: Record<string, unknown>) {
		this.lastResult = args as unknown as EvalResult;
	}
}