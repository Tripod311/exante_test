const description = `
Update the simulated customer's internal state based only on the salesperson's latest message and the resulting change in the customer's attitude.

Use this tool only once per customer response when the salesperson's message meaningfully affects the customer's state.

Each field is a delta, not an absolute value.

Allowed values:
- -2 = strong negative change
- -1 = small negative change
-  0 = no meaningful change
-  1 = small positive change
-  2 = strong positive change

Do not change a value merely because the conversation continued.
Only modify dimensions directly affected by the salesperson's latest message.

State dimensions:
- interest: how interested the customer is in continuing the discussion or considering the offered service.
- trust: how much the customer trusts the salesperson, their competence, and the information they provide.
- clarity: how well the customer currently understands the offer, product, or proposed next steps.
- readiness: how willing the customer is to take a concrete next step, such as receiving materials, scheduling another call, or considering opening an account.

The application keeps all state values between 0 and 10. You only provide the delta.
`.trim();

export default {
	name: "update_customer_state",
	description: description,
	parameters: {
		type: "object",
		properties: {
			interest: {
				type: "integer",
				minimum: -2,
				maximum: 2,
				description: "Change in customer interest."
			},
			trust: {
				type: "integer",
				minimum: -2,
				maximum: 2,
				description: "Change in customer trust."
			},
			clarity: {
				type: "integer",
				minimum: -2,
				maximum: 2,
				description: "Change in customer understanding of the offer."
			},
			readiness: {
				type: "integer",
				minimum: -2,
				maximum: 2,
				description: "Change in willingness to take a concrete next step."
			}
		},
		required: [
			"interest",
			"trust",
			"clarity",
			"readiness"
		],
		additionalProperties: false
	}
};