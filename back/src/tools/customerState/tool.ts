export interface CustomerState {
	interest: number;
	trust: number;
	clarity: number;
	readiness: number;
}

export default class CustomerStateTool {
	private currentState: CustomerState;
	private currentImpact?: CustomerState;
	private lastImpact?: CustomerState;
	public index: number = 0;
	public evolution: { impact: CustomerState; index: number; }[] = [];

	constructor (initialState: Record<string, number>) {
		this.currentState = {
			interest: initialState.interest || 0,
			trust: initialState.trust || 0,
			clarity: initialState.clarity || 0,
			readiness: initialState.readiness || 0
		};
	}

	async update (args: Record<string, unknown>) {
		console.log(`Customer state update: ${JSON.stringify(args)}`);
		this.currentImpact = args as unknown as CustomerState;
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

		return "State changed";
	}

	reset () {
		this.currentImpact = undefined;
	}

	get result (): CustomerState {
		return Object.assign({}, this.currentState);
	}
}