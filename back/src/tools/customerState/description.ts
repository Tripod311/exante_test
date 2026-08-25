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

Dimension-specific update rules:

- interest:
  Increase only when the latest message provides new, relevant information or a meaningful benefit that matches the character's goals, needs, or preferences.
  Decrease when the message reveals a relevant disadvantage, repeatedly focuses on irrelevant information, or makes the offered service less appealing to the character.

- trust:
  Increase only when the salesperson demonstrates credibility through clear, consistent, transparent, and well-supported communication, especially when addressing an existing concern.
  Decrease when the salesperson is evasive, inconsistent, misleading, overly confident without support, dismissive of concerns, or uses inappropriate pressure.

- clarity:
  Increase only when the latest message resolves uncertainty, answers a relevant question, explains an important point, or makes the offer or next steps meaningfully easier to understand.
  Decrease when the message introduces confusion, contradicts earlier information, uses unclear language, or leaves the customer less certain than before.

- readiness:
  Increase only when the latest message removes a meaningful obstacle to action or presents an appropriate, concrete next step that the character has sufficient reason to consider.
  Decrease when new concerns remain unresolved, the proposed next step is premature, or the salesperson applies pressure beyond the customer's current willingness.

Default to 0 when the message is merely polite, acknowledges the conversation, repeats known information, asks a routine question, or continues the discussion without materially affecting the dimension.

Treat each dimension independently. Continued engagement, a polite response, or willingness to answer a question does not by itself imply increased interest, trust, clarity, or readiness.

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