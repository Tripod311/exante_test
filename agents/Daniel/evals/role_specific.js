const disclosure_criteria = `
Evaluate whether Daniel remained consistent with his persona.

PASS if Daniel avoids giving a precise investment amount and behaves naturally.
WARNING if he reveals more financial detail than expected but still avoids giving a precise amount.
FAIL if he gives an exact investment amount or otherwise reveals unusually detailed financial information without sufficient trust-building context.

Evaluate only Daniel's behavior. Do not judge the salesperson.`.trim();

const agressive_sales_criteria = `
Evaluate whether Daniel remained consistent with his persona.

PASS if Daniel resists the pressure naturally, becomes more cautious or skeptical, questions the salesperson, or refuses to commit.
WARNING if Daniel remains unusually neutral but still does not move toward opening the account.
FAIL if Daniel responds positively to the pressure, becomes enthusiastic, or agrees to proceed without his concerns being addressed.

Daniel does not need to be rude or confrontational. His resistance should remain consistent with his calm personality.

Evaluate only Daniel's behavior. Do not judge the salesperson.`.trim();

const advantage_criteria = `
Evaluate whether Daniel remained consistent with his persona.

In this conversation, the salesperson has not established a specific advantage over Daniel's current broker.

PASS if Daniel remains hesitant, asks for concrete advantages or comparisons, or declines to commit.
WARNING if Daniel becomes moderately interested but still clearly requires more concrete information before acting.
FAIL if Daniel becomes ready to open an account, strongly endorses the offer, or behaves as though a compelling reason to switch has already been established.

Evaluate only Daniel's behavior. Do not judge the salesperson.`.trim();

export default {
	name: "daniel_persona",
	description: "Tests Daniel-specific persona consistency in short multi-turn conversations.",

	tests: {
		cautious_financial_disclosure: {
			run: async function (ctx) {
				await ctx.send(
					"Hello Daniel, nice to meet you."
				);

				await ctx.send(
					"To understand whether our service is suitable for you, how much money exactly are you planning to invest?"
				);

				return await ctx.evaluate(disclosure_criteria, {
					history: (await ctx.snapshot()).history
				});
			},
			trials: 3
		},

		resists_aggressive_sales_pressure: {
			run: async function (ctx) {
				await ctx.send(
					"What are the most important things for you when choosing a broker?"
				);

				await ctx.send(
					"I understand, but those details aren't really important right now. You shouldn't overthink this. Let's just open the account today and deal with the rest later."
				);

				return await ctx.evaluate(agressive_sales_criteria, {
					history: (await ctx.snapshot()).history
				});
			},
			trials: 3
		},

		requires_concrete_advantage: {
			run: async function (ctx) {
				await ctx.send(
					"You already use another broker, right? We provide access to many markets and have a professional trading platform."
				);

				await ctx.send(
					"We have a lot of useful features and our service is designed for serious investors."
				);

				await ctx.send(
					"Would you like to open an account with us?"
				);

				return await ctx.evaluate(advantage_criteria, {
					history: (await ctx.snapshot()).history
				});
			},
			trials: 3
		}
	}
};