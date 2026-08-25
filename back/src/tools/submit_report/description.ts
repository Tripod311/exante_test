const evidenceSchema = {
	type: "object",
	additionalProperties: false,

	properties: {
		messageIndex: {
			type: "integer",
			minimum: 0,
			description:
				"Zero-based index of the conversation message used as evidence."
		},

		explanation: {
			type: "string",
			maxLength: 240,
			description:
				"A concise explanation of how the referenced message supports the assessment."
		}
	},

	required: [
		"messageIndex",
		"explanation"
	]
};

const areaSchema = {
	type: "object",
	additionalProperties: false,

	properties: {
		score: {
			type: "integer",
			minimum: 1,
			maximum: 5,
			description: `
Performance score for this area:
1 = clearly ineffective or harmful;
2 = weak, with major improvement needed;
3 = adequate;
4 = strong;
5 = excellent and consistent.
			`.trim()
		},

		summary: {
			type: "string",
			maxLength: 240,
			description:
				"A concise assessment of the salesperson's performance in this area."
		},

		evidence: {
			type: "array",
			minItems: 1,
			maxItems: 2,
			description:
				"One or two conversation messages that provide the strongest evidence for the assessment.",
			items: evidenceSchema
		},

		recommendation: {
			type: "string",
			maxLength: 240,
			description:
				"One concise and actionable recommendation for improving performance in this area."
		}
	},

	required: [
		"score",
		"summary",
		"evidence",
		"recommendation"
	]
};

export default {
	name: "submit_report",

	description: `
Submit the final structured evaluation of the salesperson's performance.

Evaluate all seven required areas. Base every assessment on the supplied
conversation, customer role, and customer-state changes.

For every area:
- assign a score from 1 to 5;
- provide a concise assessment;
- cite one or two relevant conversation messages;
- provide one actionable recommendation.

messageIndex must refer to the zero-based index of the cited message in the
provided conversation.

Judge the salesperson's behavior, not whether the conversation ended in a
sale. A good conversation may end without the customer being ready to proceed.

Do not submit Markdown or additional text. Call this tool exactly once after
completing the analysis. A successful call is the final output.
	`.trim(),

	parameters: {
		type: "object",
		additionalProperties: false,

		properties: {
			schemaVersion: {
				type: "integer",
				const: 1,
				description: "Version of the structured report schema."
			},

			overallSummary: {
				type: "string",
				maxLength: 500,
				description:
					"A concise overall assessment of the conversation, limited to two or three sentences."
			},

			areas: {
				type: "object",
				additionalProperties: false,

				properties: {
					customer_understanding: {
						...areaSchema,
						description:
							"How well the salesperson identified and responded to the customer's needs, goals, experience, and concerns."
					},

					communication_quality: {
						...areaSchema,
						description:
							"How clear, relevant, concise, professional, and appropriately paced the salesperson's communication was."
					},

					trust_building: {
						...areaSchema,
						description:
							"How effectively the salesperson built credibility through transparency, accuracy, empathy, and respectful behavior."
					},

					product_knowledge: {
						...areaSchema,
						description:
							"How accurately and appropriately the salesperson explained EXANTE's products, services, fees, regulation, and relevant features."
					},

					objection_handling: {
						...areaSchema,
						description:
							"How effectively the salesperson acknowledged, explored, and addressed the customer's objections and concerns."
					},

					missed_opportunities: {
						...areaSchema,
						description:
							"Important questions, connections, explanations, or responses that the salesperson could reasonably have provided but missed."
					},

					next_steps: {
						...areaSchema,
						description:
							"How appropriately the salesperson assessed readiness and proposed, avoided, or timed a concrete next step."
					}
				},

				required: [
					"customer_understanding",
					"communication_quality",
					"trust_building",
					"product_knowledge",
					"objection_handling",
					"missed_opportunities",
					"next_steps"
				]
			}
		},

		required: [
			"schemaVersion",
			"overallSummary",
			"areas"
		]
	}
};