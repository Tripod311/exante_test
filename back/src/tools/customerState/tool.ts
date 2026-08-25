export interface CustomerState {
	interest: number;
	trust: number;
	clarity: number;
	readiness: number;
}

const modifier = `
You will also receive the character's current internal state as customerState.
Each parameter is an integer from 0 to 10. Use it as behavioral context for the character's tone, openness, confidence, skepticism, and readiness. Treat values as tendencies, not explicit instructions.
Never mention customerState, parameter names or values, state changes, or the update_customer_state tool. The persona and its goals always take priority. State changes must influence behavior naturally and must not abruptly alter the character's personality.

<data type="customerState">
%STATE%
</data>	
`.trim();

export default class CustomerStateTool {
	private currentState: CustomerState;
	private currentImpact?: CustomerState;
	private lastImpact?: CustomerState;
	public index: number = 0;
	public evolution: { impact: CustomerState; index: number; }[] = [];

	constructor (initialState: CustomerState) {
		this.currentState = {
			interest: Math.min(10, Math.max(0, initialState.interest)),
			trust: Math.min(10, Math.max(0, initialState.trust)),
			clarity: Math.min(10, Math.max(0, initialState.clarity)),
			readiness: Math.min(10, Math.max(0, initialState.readiness))
		};
	}

	async update(args: Record<string, unknown>) {
		const normalize = (value: unknown): number => {
			if (typeof value !== "number" || !Number.isInteger(value)) {
				return 0;
			}

			return Math.max(-2, Math.min(2, value));
		};

		this.currentImpact = {
			interest: normalize(args.interest),
			trust: normalize(args.trust),
			clarity: normalize(args.clarity),
			readiness: normalize(args.readiness)
		};

		return {
			"impactToApply": this.currentImpact,
			"currentState": this.currentState
		}
	}

	commit () {
		if (this.currentImpact !== undefined &&
				(
					this.currentImpact.interest !== 0 ||
					this.currentImpact.trust !== 0 ||
					this.currentImpact.clarity !== 0 ||
					this.currentImpact.readiness !== 0
				)
			) {
			this.evolution.push({
				impact: this.currentImpact,
				index: this.index
			});
			this.currentState.interest = Math.min(10, Math.max(0, this.currentState.interest + this.currentImpact.interest));
			this.currentState.trust = Math.min(10, Math.max(0, this.currentState.trust + this.currentImpact.trust));
			this.currentState.clarity = Math.min(10, Math.max(0, this.currentState.clarity + this.currentImpact.clarity));
			this.currentState.readiness = Math.min(10, Math.max(0, this.currentState.readiness + this.currentImpact.readiness));

			this.lastImpact = this.currentImpact;
			this.currentImpact = undefined;
		}
	}

	reset () {
		this.currentImpact = undefined;
	}

	get result (): CustomerState {
		return Object.assign({}, this.currentState);
	}

	get promptModifier (): string {
		return modifier.replace("%STATE%", JSON.stringify(this.currentState));
	}
}