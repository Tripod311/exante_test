# What I'm Not Doing and Why

The prototype is intentionally narrow.

The goal was not to build a production-ready sales training platform, but to validate the core vertical slice:

**select a persona → have a conversation → finish the session → receive useful feedback**

Everything that did not materially help validate this loop was either simplified or left out.

## Production Security

The prototype does not implement production-grade authentication, authorization, CORS policies, rate limiting, or other deployment-specific security controls.

These are necessary for a real system, especially one containing employee performance data, but they do not help answer the main question of this proof of concept: whether an LLM-driven client simulation and evaluation loop can work effectively.

The appropriate security model would also depend on the eventual deployment environment and integration requirements.

---

## Rich User Interface

The UI is deliberately minimal.

It supports only the core workflow:

1. select a persona;
2. start a conversation;
3. finish the session;
4. read the report.

I intentionally avoided spending significant time on visual polish, dashboards, animations, advanced navigation, or other interface features before validating the underlying interaction.

A production version would benefit from a considerably better conversation and reporting experience, but none of those improvements change the core architecture.

---

## Full EXANTE RAG and Web Crawling

The prototype does not contain a production-grade retrieval pipeline or crawler for continuously maintaining EXANTE product knowledge.

Instead, the Analyzer receives a small curated set of relevant EXANTE facts directly in its context.

For one scenario, this is sufficient and avoids introducing infrastructure that provides little additional value at this stage.

A production system would likely maintain an indexed knowledge base built from official EXANTE sources and retrieve relevant information dynamically. This would be particularly useful for validating salesperson claims and identifying product capabilities that could have been relevant during a conversation.

---

## Persona Storage in Files

Personas are stored as files rather than in a database or administration system.

This is a deliberate choice.

A persona can be represented as a self-contained artifact containing:

* its role prompt;
* configuration;
* initial state;
* persona-specific evals;
* evaluation results.

This makes personas easy to inspect, version in Git, copy, review, and move between environments as a complete unit.

For the current scale, file-based storage is simpler and more transparent than introducing a database-backed persona management system.

If the number of personas grows significantly or non-technical users need to manage them, this representation can later be placed behind a database or administrative interface without changing the core agent model.

---

## Production Conversation and Report Storage

Conversation history and generated reports currently use simple file-based persistence.

The final storage architecture is intentionally undecided because it depends strongly on deployment.

A traditional hosted back end could use a relational database and object storage, while a serverless deployment may require a very different persistence strategy.

Choosing one prematurely would add infrastructure based on assumptions that are not part of the assignment.

For the proof of concept, files provide sufficient persistence and keep the storage boundary easy to replace later.

---

## Regression Dashboard

Evaluation results are currently exposed through the CLI and can also be stored as JSON.

There is no dedicated dashboard for comparing regression runs, models, prompts, or personas.

Such a dashboard would certainly be useful as the evaluation suite grows, but it is primarily a presentation layer over data the harness already produces.

Building it does not validate the difficult part of the system — whether useful behavioral evaluations can be defined and executed.

The current priority is therefore the evaluation mechanism itself rather than visualization around it.

---

## WebSockets and Streaming Transport

The initial design considered using WebSockets for conversation transport, but they were removed from the prototype.

For the current interaction model, request/response HTTP is sufficient.

This decision also avoids unnecessarily constraining deployment. Persistent WebSocket connections can complicate some serverless hosting approaches, while the application can function without them.

If lower perceived latency or token streaming becomes important, streaming transport can be added later without fundamentally changing the character, session, provider, or analyzer architecture.

---

## Persona and Scenario Management UI

The prototype does not include an administration interface for creating, editing, publishing, or versioning personas and scenarios.

There is only one vertical slice to demonstrate, and personas can currently be edited directly as artifacts.

A production system with dozens of scenarios would likely require schema validation, versioning, lifecycle management, and eventually an editor for non-technical users.

Building that interface before establishing what a good persona definition actually looks like would optimize the wrong problem.

---

## Large Scenario Library

The prototype intentionally contains only the persona and scenario required to demonstrate the complete workflow.

The purpose is to prove that the underlying mechanism works, not to demonstrate content volume.

Additional personas and scenarios are primarily content and validation work once the runtime architecture is established.

---

## Aggregate "Sales Score"

The prototype does not reduce salesperson performance to a single numerical score.

Customer state values such as trust or readiness describe the simulated client's internal state; they are not objective measurements of salesperson quality.

Likewise, an LLM evaluator is not reliable enough to justify presenting a number such as `82/100` as an authoritative measurement of sales ability without substantial calibration.

The prototype therefore prioritizes concrete observations, conversation evidence, and actionable recommendations.

A standardized scoring model could be introduced later if it is calibrated against real assessments from experienced EXANTE sales managers.

---

## Production Scale and Infrastructure

The prototype does not attempt to solve distributed execution, high availability, centralized observability, queues, horizontal scaling, or other large-scale infrastructure concerns.

Those decisions depend on expected traffic, hosting environment, organizational infrastructure, privacy requirements, and integration constraints that are currently unknown.

The prototype instead focuses on keeping the important boundaries explicit — sessions, agents, providers, analysis, and evaluation — so that production infrastructure can be added around them later.

---

## Scope Principle

The main design principle behind these omissions is simple:

> **Build enough infrastructure to validate the uncertain parts, and avoid building infrastructure for requirements that are not known yet.**

The uncertain parts of this project are primarily the quality of the simulated client, the usefulness of the resulting feedback, and the ability to detect behavioral regressions when prompts or models change.

Those are the areas the prototype invests in.
