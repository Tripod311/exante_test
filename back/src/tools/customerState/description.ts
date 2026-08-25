const description = `
Update the customer's internal state based on the salesperson's latest message, interpreted in the context of the conversation history.

Use the conversation history to understand:
- what the customer previously asked or expressed concern about;
- what information the salesperson has already provided;
- whether the latest message completes, clarifies, supports, contradicts,
  or resolves something discussed earlier.

Each field is a delta, not an absolute value.

Allowed values:
- -2 = strong negative change
- -1 = small negative change
-  0 = no meaningful change
-  1 = small positive change
-  2 = strong positive change

Do not change a value merely because the conversation continued.
Apply only changes that became justified as a result of the latest message,
while using the full conversation history to determine its meaning and impact.

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