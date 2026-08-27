export default {
	name: "basic_reasoning",
	description: "Tests basic reasoning and reasonable customer-state reactions in clear, persona-independent situations.",

	tests: {
		async neutral_greeting (ctx) {
			const message = "Hello, nice to meet you.";
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(message);

			const stateAfter = (await ctx.snapshot()).customerState;

			for (const name in initialState) {
				if (initialState[name] !== stateAfter[name]) {
					return {
						status: "fail",
						details: `Parameter ${name} was altered after a neutral greeting`
					};
				}
			}

			return {
				status: "pass"
			};
		},

		async direct_rudeness (ctx) {
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(
				"You're wasting my time with these questions. Stop arguing and listen to what I'm telling you."
			);

			const state = (await ctx.snapshot()).customerState;

			// Rudeness should never improve these dimensions.
			if (state.trust > initialState.trust) {
				return {
					status: "fail",
					details: "Trust increased after directly rude and dismissive communication"
				};
			}

			if (state.interest > initialState.interest) {
				return {
					status: "fail",
					details: "Interest increased after directly rude and dismissive communication"
				};
			}

			if (state.readiness > initialState.readiness) {
				return {
					status: "fail",
					details: "Readiness increased after directly rude and dismissive communication"
				};
			}

			// At least one meaningful negative reaction is expected.
			if (
				state.trust === initialState.trust &&
				state.interest === initialState.interest &&
				state.readiness === initialState.readiness
			) {
				return {
					status: "fail",
					details: "Direct rudeness caused no negative customer-state reaction"
				};
			}

			return {
				status: "pass"
			};
		},

		async aggressive_pressure (ctx) {
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(
				"There is nothing else you need to think about. You should open the account right now."
			);

			const state = (await ctx.snapshot()).customerState;

			if (state.trust > initialState.trust) {
				return {
					status: "fail",
					details: "Trust increased after unjustified sales pressure"
				};
			}

			if (state.readiness > initialState.readiness) {
				return {
					status: "fail",
					details: "Readiness increased after unjustified sales pressure"
				};
			}

			return {
				status: "pass"
			};
		},

		async clear_explanation (ctx) {
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(
				"Let me explain the next step clearly. First, we identify what you need from the service. Then we can discuss whether the available options actually fit those needs. You do not need to make a decision now."
			);

			const state = (await ctx.snapshot()).customerState;

			if (state.clarity < initialState.clarity) {
				return {
					status: "fail",
					details: "Clarity decreased after a clear and structured explanation"
				};
			}

			if (state.trust < initialState.trust) {
				return {
					status: "fail",
					details: "Trust decreased after neutral, transparent and non-pressuring communication"
				};
			}

			return {
				status: "pass"
			};
		},

		async confusing_explanation (ctx) {
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(
				"The solution uses a dynamically optimized cross-product framework with integrated multi-layer execution characteristics and strategically aligned operational parameters."
			);

			const state = (await ctx.snapshot()).customerState;

			if (state.clarity > initialState.clarity) {
				return {
					status: "fail",
					details: "Clarity increased after a deliberately vague and jargon-heavy explanation"
				};
			}

			return {
				status: "pass"
			};
		},

		async respectful_uncertainty (ctx) {
			const initialState = (await ctx.snapshot()).customerState;

			await ctx.send(
				"I don't want to give you an inaccurate answer. I would need to verify that detail before confirming it."
			);

			const state = (await ctx.snapshot()).customerState;

			if (state.trust < initialState.trust) {
				return {
					status: "fail",
					details: "Trust decreased after the salesperson explicitly avoided making an unsupported claim"
				};
			}

			return {
				status: "pass"
			};
		}
	}
};