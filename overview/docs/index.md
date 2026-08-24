# Product Vision

## Purpose

The EXANTE Sales Simulator is a training and assessment tool for evaluating a salesperson's ability to communicate with potential brokerage clients.

For the salesperson, it provides a safe environment to practice conversations with different client types, test different approaches, and rehearse the sale of new products without creating any risk for real client relationships or real deals.

For the company, the simulator can serve several purposes.

### 1. Assessment of new salespeople

A simulated client conversation can be used as an additional signal during hiring or onboarding.

Instead of relying only on interviews or theoretical questions, the company can observe how a salesperson behaves in a realistic conversation: how they identify needs, respond to objections, explain products, build trust, and move toward an appropriate next step.

The resulting report provides an additional structured perspective on the conversation.

### 2. Safe practice

When a new product, service, or sales approach is introduced, employees can rehearse it before using it with real clients.

AI clients can reproduce different attitudes, concerns, levels of financial knowledge, and communication styles while keeping the environment safe and repeatable.

Mistakes become part of the training process rather than a risk to a real relationship.

### 3. Progress over time

The value of the simulator should not stop after the first few sessions.

As more personas and scenarios are added, repeated simulations can provide a history of how a salesperson performs across different client types and situations.

With persistent user accounts, the system could track recurring strengths, weaknesses, and improvement over time rather than treating every conversation as an isolated event.

The architecture intentionally keeps personas and scenarios relatively independent, allowing the training set to grow without rebuilding the core system.

---

## Evaluation Approach

The simulator uses two complementary sources of feedback.

### Customer state

The simulated client currently has four internal state dimensions:

* **Trust**
* **Interest**
* **Clarity**
* **Readiness**

These values affect how the client behaves during the conversation and can change in response to the salesperson's messages.

Their main purpose is not to produce a single final score. Instead, they provide a trace of how individual messages influenced the simulated customer's attitude.

This makes it possible to identify moments where a particular response increased trust, created confusion, improved interest, or pushed the client away.

The state model therefore acts as a behavioral signal rather than an objective measure of sales quality.

### AI-generated report

At the end of the conversation, a separate evaluator analyzes the complete dialogue.

It considers:

* the client persona;
* the initial and final customer state;
* state changes caused by individual messages;
* the full conversation transcript;
* relevant factual information about EXANTE.

The evaluator looks for concrete strengths, weaknesses, missed opportunities, poor explanations, objection handling, and relevant EXANTE capabilities that could have been discussed.

The report is intentionally concise. Its purpose is to give the salesperson a small number of observations that can be acted on in the next session, rather than generate a long generic sales analysis.

### Why combine both

Neither mechanism is intended to be treated as absolute ground truth.

The numerical customer state shows whether the salesperson's approach worked for the specific simulated personality.

The evaluator provides a broader qualitative view and can identify issues that cannot be represented well by a few state variables, such as an inaccurate product claim or a missed opportunity to discuss a relevant EXANTE capability.

Together they provide more useful feedback than either mechanism alone.

---

## Repeatability and Long-Term Value

An important property of an LLM-based simulation is that sessions are neither completely deterministic nor completely different.

The same persona retains its main goals, concerns, and behavioral characteristics, while the exact dialogue may develop differently each time.

This creates a useful form of repeatability.

A salesperson can replay the same scenario and try:

* a different opening;
* different discovery questions;
* another way of handling an objection;
* a shorter or more detailed explanation;
* a different moment for proposing the next step.

The goal is not to find one phrase that maximizes a score. The value comes from experimenting with different approaches against a reasonably consistent client profile.

There is also a lightweight gamification effect: repeated sessions make improvement visible and encourage the salesperson to try again.

After ten sessions, the interesting question should no longer be simply *"Did this conversation go well?"*

It should become:

> *"What am I consistently good at, where do I still struggle, and am I improving?"*

This is where persistent history and cross-session analysis become more valuable than the result of any single simulation.

The simulator cannot reproduce a real person perfectly. However, sufficiently realistic personas — especially ones based on recurring patterns observed in real client conversations — can still provide useful practice for common sales situations.

---

## Current Scope

The current implementation is deliberately a small proof of concept.

It contains:

* one playable client scenario;
* a stateful AI persona;
* a complete dialogue flow;
* per-message customer state changes;
* a final AI-generated evaluation;
* a test harness for validating agent behavior.

The goal of the prototype is to demonstrate the complete loop:

**scenario → conversation → reaction → resolution → feedback**

It is intentionally not a complete training platform.

---

## Possible Evolution

If the concept proves useful, several capabilities could grow around the core simulation loop.

### User accounts and history

Authentication and persistent profiles would allow conversations, reports, and performance history to be stored for each salesperson.

This would make longitudinal analysis possible.

### Progress tracking

Instead of evaluating sessions independently, the system could identify recurring patterns across conversations and highlight improvement or regression over time.

For example, it could detect that objection handling is improving while discovery remains consistently weak.

### Larger persona and scenario library

Additional personas could represent different client profiles, levels of financial knowledge, objections, risk attitudes, and communication styles.

Scenarios could focus on specific EXANTE products, onboarding situations, difficult objections, or particular stages of a sales conversation.

### EXANTE knowledge retrieval

The current prototype provides the evaluator with a small curated set of EXANTE product facts.

A production version could use a maintained knowledge base and RAG pipeline backed by official EXANTE sources.

This would allow the evaluator to verify product claims against a broader and more current information set and identify relevant EXANTE capabilities that were missed during the conversation.

### Improved interaction

The current UI is intentionally minimal.

A production version could add response streaming, improved conversation presentation, session history, report navigation, and a clearer view of progress over time.

These additions are useful, but they remain secondary to the core product loop: realistic practice followed by useful feedback.
