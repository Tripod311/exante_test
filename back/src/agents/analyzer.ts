import fs from "fs"
import type Provider from "../providers/provider.js"
import type { CustomerState } from "../tools/customerState/tool.js"

const prompt = `
You are evaluating the quality of a salesperson's conversation with a simulated brokerage client.

You will receive:
- the customer persona;
- the customer's initial state;
- the customer's final state;
- the total state delta;
- the full conversation transcript with per-message state impact annotations showing how particular salesperson messages affected the simulated customer.

Your task is to produce a concise, practical assessment of the salesperson's communication quality.

Important rules:
- Treat the conversation transcript as the primary source of evidence.
- Treat customer state changes as supporting signals, not absolute ground truth.
- Do not invent facts, products, policies, or customer needs that are not present in the provided data.
- Do not judge success only by whether the customer became more interested or ready to proceed.
- A good conversation may correctly identify that the customer is not a good fit or may end without a sale.
- Consider the customer's persona and initial attitude when interpreting the result.
- Pay particular attention to messages that caused strong positive or negative state changes.
- Prefer specific observations tied to the conversation over generic sales advice.
- Keep the report brief and useful.

Evaluate the conversation in these areas:
1. Understanding the customer — whether the salesperson identified relevant goals, concerns, needs, and objections.
2. Communication quality — whether responses were clear, relevant, natural, and appropriately concise.
3. Trust building — whether the salesperson increased confidence or caused skepticism through pressure, unsupported claims, contradictions, or poor explanations.
4. Handling objections — whether concerns raised by the customer were acknowledged and addressed meaningfully.
5. Progression — whether the salesperson moved the conversation toward an appropriate next step without forcing it.

Return the report in the following JSON format:

{
  "summary": "Brief overall assessment in 2-4 sentences.",
  "strengths": [
    "Specific thing the salesperson did well"
  ],
  "weaknesses": [
    "Specific problem or missed opportunity"
  ],
  "key_moments": [
    {
      "message_index": 0,
      "impact": "positive",
      "explanation": "Why this message significantly affected the conversation"
    }
  ],
  "customer_outcome": "Short explanation of how the customer's interest, trust, clarity and readiness changed during the conversation.",
  "recommendations": [
    "Concrete suggestion for the salesperson's next conversation"
  ]
}

Use "positive" or "negative" for key_moments.
Include only genuinely important moments.
Usually return 1-3 strengths, 1-3 weaknesses, 1-3 key moments, and 1-3 recommendations.
`.trim();

const taskPrompt = `
CUSTOMER PERSONA:
%ROLE%

INITIAL STATE:
%INITIAL_STATE%

FINAL STATE:
%FINAL_STATE%

STATE DELTA:
%STATE_DELTA%

CONVERSATION:
%CONVERSATION%
`.trim();

export default class Analyzer {
	static async generateReport (provider: Provider, data: ReportData) {
		const task = taskPrompt
			.replace("%ROLE%", data.role)
			.replace("%INITIAL_STATE%", JSON.stringify(data.initialState))
			.replace("%FINAL_STATE%", JSON.stringify(data.finalState))
			.replace("%STATE_DELTA%", JSON.stringify(data.stateDelta))
			.replace("%CONVERSATION%", JSON.stringify(data.conversation));

		data.result = await provider.request({
			systemPrompt: prompt,
			messages: [
				{
					role: "user",
					content: taskPrompt
				}
			],
			tools: []
		});
	}
}