# Questions and Assumptions

The following questions would materially affect how the product should evolve beyond the proof of concept. For the prototype, I made explicit assumptions in order to keep development moving without over-specifying unknown requirements.

## 1. Who is the application for?

**Question:**
Is the simulator intended primarily for already hired relationship managers, for evaluating candidates before hiring, or for managers who want to assess the communication and sales skills of existing employees?

**Assumption:**
The application can support all of these use cases.

Existing salespeople can use it as a safe environment for practice, while managers can use simulated conversations and generated reports as an additional signal when reviewing either current employees or candidates.

The prototype therefore does not optimize the experience around only one of these roles.

---

## 2. Is the application primarily for training or assessment?

**Question:**
Should the simulator be treated mainly as a training tool, or as a formal mechanism for evaluating salesperson performance?

**Assumption:**
An LLM-based conversation should not be treated as an authoritative measurement of professional skill.

However, simulated conversations can still reveal useful and recurring patterns in communication, discovery, objection handling, and sales behavior.

For this reason, the prototype treats AI evaluation as a useful signal and coaching mechanism rather than an objective verdict.

---

## 3. What constitutes a good client conversation?

**Question:**
What behaviors should EXANTE consider indicators of a successful sales conversation?

**Assumption:**
A good conversation is not necessarily one that immediately results in a sale.

The prototype evaluates whether the salesperson understood the customer, adapted to their preferences, addressed concerns, communicated clearly, and used relevant arguments.

Two complementary signals are used:

* the simulated customer's changing internal state;
* qualitative analysis by a separate evaluator agent.

For production use, the evaluation criteria should be reviewed and calibrated together with experienced EXANTE sales professionals.

---

## 4. How should an LLM persona be defined?

**Question:**
What should the simulated client's role be based on: fully fictional personas, generic customer archetypes, or patterns derived from real client conversations?

**Assumption:**
The prototype uses fictional clients with realistic needs, concerns, and personality traits that could reasonably occur in real conversations.

For production use, personas could be informed by recurring patterns found in real sales conversations, provided that all personally identifying and sensitive client information is removed first.

This could make simulated behavior more representative of situations that salespeople actually encounter.

---

## 5. Who should create personas and their tests?

**Question:**
Will personas, scenarios, and behavioral evals be maintained by engineers, sales managers, training specialists, or some combination of these roles?

**Assumption:**
The prototype assumes a technically capable author who can directly edit persona artifacts, configuration, and tests.

If the system grows, a dedicated editing interface could make persona and scenario creation accessible to less technical users who may have significantly better domain knowledge, such as sales managers or training specialists.

Engineering would still be responsible for validation, versioning, and the underlying runtime.

---

## 6. Where should EXANTE product information come from?

**Question:**
What should be considered the authoritative source for EXANTE products, services, fees, capabilities, and other facts used by the evaluator?

**Assumption:**
The prototype uses a fixed, curated set of EXANTE information embedded directly into the evaluator context.

For production use, this should likely be replaced with a maintained retrieval system, such as RAG over approved EXANTE sources, potentially supported by automated ingestion or crawling.

The goal would be to keep evaluation grounded in current product information rather than relying on the LLM's pre-trained knowledge.

---

## 7. Should employees and managers see the same report?

**Question:**
Should the salesperson-facing report contain the same information as the report available to management?

**Assumption:**
The prototype exposes the same report to both audiences.

For an initial implementation, this is sufficient: the salesperson can review their own conversation and feedback, while a manager can inspect how that person handled a particular simulated client.

A production system may benefit from separate views. The salesperson-facing report could focus on coaching and concrete next steps, while the management view could include broader patterns and historical performance.

---

## 8. Which languages should the application support?

**Question:**
Should simulations be limited to English, or should they support the languages used by EXANTE salespeople and clients?

**Assumption:**
The prototype uses English only.

The architecture itself is not language-specific, and different models can be configured depending on the required language.

This matters because model quality, naturalness, and instruction-following can vary significantly between languages. Each supported language would therefore require its own behavioral validation.

---

## 9. How much should conversations vary between runs?

**Question:**
Should repeated runs of the same persona and scenario produce highly similar conversations for comparability, or should they vary significantly to better simulate real people?

**Assumption:**
The current system aims for moderate variation.

The persona definition and initial customer state provide consistent starting conditions, while the LLM is free to vary wording and conversational development.

As the conversation progresses, changes in customer state may also influence behavior.

This provides repeatability without turning the interaction into a scripted dialogue.

---

## Key Assumption

The largest assumption behind the prototype is that the main product risk is not infrastructure.

It is whether an LLM can provide:

1. a sufficiently consistent and believable client simulation;
2. meaningful reactions to salesperson behavior;
3. useful post-conversation feedback.

The prototype is therefore optimized to test these assumptions first.
