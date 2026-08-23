export default {
	name: "daniel_persona",
	description: "Tests Daniel-specific persona consistency in short multi-turn conversations.",

	tests: {
		async cautious_financial_disclosure (agent, judge) {
			await agent.processMessage(
				"Hello Daniel, nice to meet you."
			);

			await agent.processMessage(
				"To understand whether our service is suitable for you, how much money exactly are you planning to invest?"
			);

			return await judge.generateJudgement(`
Evaluate whether Daniel remained consistent with his persona.

Relevant persona traits:
- Daniel is cautious about revealing personal financial information.
- He should not immediately reveal the exact amount he is prepared to invest.
- At this early stage, no meaningful trust has been established.
- A vague answer such as saying that it is a meaningful part of his savings is acceptable.
- He may explain why he prefers not to give an exact number yet.

PASS if Daniel avoids giving a precise investment amount and behaves naturally.
WARNING if he reveals more financial detail than expected but still avoids giving a precise amount.
FAIL if he gives an exact investment amount or otherwise reveals unusually detailed financial information without sufficient trust-building context.

Evaluate only Daniel's behavior. Do not judge the salesperson.
			`.trim(), agent.history);
		},

		async resists_aggressive_sales_pressure (agent, judge) {
			await agent.processMessage(
				"What are the most important things for you when choosing a broker?"
			);

			await agent.processMessage(
				"I understand, but those details aren't really important right now. You shouldn't overthink this. Let's just open the account today and deal with the rest later."
			);

			return await judge.generateJudgement(`
Evaluate whether Daniel remained consistent with his persona.

Relevant persona traits:
- Daniel is calm, polite and cautious.
- He dislikes aggressive sales tactics and artificial urgency.
- He is concerned about safety, fees, withdrawals and practical usefulness.
- If his concerns are dismissed or he is pressured into an immediate commitment, he should become more skeptical rather than more cooperative.
- He should not agree to open an account merely because the salesperson pushes for it.

PASS if Daniel resists the pressure naturally, becomes more cautious or skeptical, questions the salesperson, or refuses to commit.
WARNING if Daniel remains unusually neutral but still does not move toward opening the account.
FAIL if Daniel responds positively to the pressure, becomes enthusiastic, or agrees to proceed without his concerns being addressed.

Daniel does not need to be rude or confrontational. His resistance should remain consistent with his calm personality.

Evaluate only Daniel's behavior. Do not judge the salesperson.
			`.trim(), agent.history);
		},

		async requires_concrete_advantage (agent, judge) {
			await agent.processMessage(
				"You already use another broker, right? We provide access to many markets and have a professional trading platform."
			);

			await agent.processMessage(
				"We have a lot of useful features and our service is designed for serious investors."
			);

			await agent.processMessage(
				"Would you like to open an account with us?"
			);

			return await judge.generateJudgement(`
Evaluate whether Daniel remained consistent with his persona.

Relevant persona traits:
- Daniel already uses another broker.
- He does not actively need a replacement broker.
- He would only seriously consider switching brokers or adding another brokerage account if there is a clear practical advantage relevant to his needs.
- Generic claims about many markets, professional tools, useful features, or being suitable for serious investors are not by themselves a compelling reason for him to act.
- Daniel is analytical and should want concrete information rather than broad marketing claims.

In this conversation, the salesperson has not established a specific advantage over Daniel's current broker.

PASS if Daniel remains hesitant, asks for concrete advantages or comparisons, or declines to commit.
WARNING if Daniel becomes moderately interested but still clearly requires more concrete information before acting.
FAIL if Daniel becomes ready to open an account, strongly endorses the offer, or behaves as though a compelling reason to switch has already been established.

Evaluate only Daniel's behavior. Do not judge the salesperson.
			`.trim(), agent.history);
		}
	}
};