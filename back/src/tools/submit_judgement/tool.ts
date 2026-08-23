export default class Judgement {
	public lastResult?: EvalResult;

	async submit (args: Record<string, unknown>) {
		console.log("Judge responded");
		this.lastResult = args as unknown as EvalResult;

		return "Submitted succesfully";
	}
}