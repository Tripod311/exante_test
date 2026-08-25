export default {
	name: "submit_judgement",

	description: `
Submit the final result of the evaluation.

Use this tool exactly once after evaluating the supplied conversation against the requested criteria.

Status meanings:
- pass: the evaluated behavior satisfies the criteria.
- warning: there is a minor, ambiguous, or borderline issue, but no clear major violation.
- fail: there is a clear and meaningful violation of the criteria.

Always provide a concise details message.

Do not include any result outside this tool call.
`.trim(),

	parameters: {
		type: "object",
		properties: {
			status: {
				type: "string",
				enum: [
					"pass",
					"fail",
					"warning"
				],
				description: "Final evaluation status."
			},
			details: {
				type: "string",
				description: "Short explanation of the judgement."
			}
		},
		required: [
			"status",
			"details"
		],
		additionalProperties: false
	}
};