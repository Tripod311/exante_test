const modifier = `
After evaluating each salesperson message, you may call update_customer_state tool if you determine that message should affect any of customer state parameters
Call this tool only when the salesperson's latest message causes a meaningful change in the customer's internal state.
State changes must be conservative. Most ordinary messages should cause changes of 0 or ±1. Use ±2 only when the salesperson's message has a clearly strong positive or negative effect.
Do not call it for greetings, acknowledgements, small talk, or messages that do not materially affect customer state.
`.trim();

export default modifier