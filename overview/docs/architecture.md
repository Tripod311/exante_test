<p align="center">
  <a href="../assets/architecture.png" target="_blank" rel="noopener">
    <img
      src="/assets/architecture.png"
      alt="Architecture diagram"
      style="max-width: 100%; height: auto;"
    >
  </a>
</p>

# Architecture

## Overview

The application consists of a front-end SPA built with **React, TypeScript, and Tailwind CSS**, and a back end built with **Express and TypeScript**.

The front end communicates with the back end through JSON-based REST requests.

The back end is split into several logical modules:

1. **API** — a thin Express layer that connects the web client to the rest of the back-end services over HTTP.

2. **Session Manager** — manages agent sessions. It creates chat sessions from persona artifacts, tracks their lifetime, and starts report generation when a conversation ends.

3. **Character Agent** — the runtime instance of a persona. It stores the conversation history and the current customer state, which can be modified through a dedicated tool.

4. **LLM Provider** — an abstraction over communication with language models. The current implementation uses the OpenAI-compatible protocol because it is widely supported. Additional providers, such as Anthropic or other APIs, can be added behind the same interface.

   Multiple providers can be configured at the same time. This is intentional: report generation and evaluation usually benefit from a larger and more stable model, while character simulation can be tested with different models depending on latency, cost, and behavior. Provider and model selection is defined in `configuration.json`.

5. **Analyzer Agent** — analyzes completed conversations and generates the final feedback report.

6. **Testing Suite** — a CLI entry point for running evals and regression tests against personas and agents using the same runtime mechanisms as the application itself.

7. **Evaluation Judge** — an auxiliary LLM-based evaluator used by tests where behavior cannot be checked reliably with deterministic code alone, such as whether a character stayed in role or reacted naturally to a situation.

The architecture deliberately keeps agent behavior, session orchestration, LLM access, and evaluation separate. This makes it possible to change models, prompts, personas, and test logic without tightly coupling those concerns.

---

## Runtime Flow

A normal session follows a simple flow:

1. The user selects a character in the web UI.

2. The back end creates a new session and initializes the character using its persona artifacts and configuration. The client receives a unique session identifier.

3. The user communicates with the Character Agent. During the conversation, the agent may update its internal customer state through the dedicated state tool.

   A conversation ends either when the configured session timeout is reached or when the user explicitly finishes it from the UI.

4. Once the session is complete, the Session Manager starts the Analyzer Agent.

   The analyzer receives:

   * the persona description;
   * the initial customer state;
   * the final customer state;
   * the accumulated state changes;
   * the full conversation transcript;
   * relevant EXANTE product information.

5. The generated report is returned to the UI.

   A copy of the report data is also stored locally using the session UUID as its identifier. UUID collisions are practically negligible for this use case. The report can later be reopened from the UI through a shareable session link.

The complete runtime loop is therefore:

**persona → session → conversation → state changes → resolution → analysis → report**

---

## Character Agent

A character is assembled from several artifacts rather than being defined as a single large prompt.

### Persona definition

`role.md` defines the persistent aspects of the simulated client, such as:

* personality;
* goals;
* preferences;
* motivations;
* communication style;
* behavioral patterns;
* concerns and expectations.

These characteristics are intended to remain stable throughout the session.

### Character configuration

`configuration.json` contains runtime settings such as:

* the LLM provider and model used by the character;
* conversation timeout;
* initial customer state.
* temperature and top_p parameters

The current customer state consists of four dimensions:

* `interest`
* `trust`
* `clarity`
* `readiness`

### Customer state

Customer state represents the character's current attitude during the conversation.

It is not intended to overwrite the persona. Instead, it modifies how the same persona behaves at a particular point in the dialogue.

For example, a skeptical character should remain recognizably skeptical even after trust increases. Higher trust may make the character more open to explanations or next steps, but should not turn them into a fundamentally different person.

The agent can modify its state through a dedicated tool. Updates are intentionally conservative and are applied as small deltas in response to meaningful salesperson messages.

These changes serve three purposes:

* they affect later character behavior;
* they create a trace of how individual messages influenced the simulated customer;
* they provide additional evidence to the Analyzer.

Customer state is therefore **not a direct score of salesperson quality**. It is better treated as one additional behavioral signal.

---

## Analyzer

The Analyzer Agent generates feedback after the conversation has ended.

The conversation transcript is treated as the primary source of evidence. Customer state changes are supporting signals rather than absolute ground truth.

The analyzer receives:

* the customer persona;
* initial and final state;
* total and per-message state changes;
* the complete transcript;
* EXANTE product context.

It evaluates the conversation in areas such as:

* understanding the customer's goals and concerns;
* communication quality;
* trust building;
* objection handling;
* product relevance;
* missed opportunities;
* progression toward an appropriate next step.

The analyzer is specifically instructed not to judge success only by whether the customer became more interested or more ready to proceed.

A good conversation may correctly determine that the client is not a good fit, or may end without a sale.

The report is intentionally concise. Its purpose is not to generate a long generic sales essay, but to identify a small number of useful strengths, weaknesses, key moments, and concrete recommendations.

Where possible, feedback should be tied to specific parts of the conversation.

---

## EXANTE Knowledge

The current proof of concept provides the Analyzer with a compact, curated set of EXANTE product facts directly in its prompt context.

This information is used to:

* check whether salesperson claims about EXANTE are supported;
* determine whether suggested products or capabilities were relevant;
* identify clearly relevant EXANTE capabilities that were missed;
* avoid relying entirely on the model's pre-trained knowledge.

A full retrieval system is deliberately outside the current prototype scope.

For a production version, this can evolve into a maintained EXANTE knowledge base backed by RAG over official sources.

A likely flow would be:

**official EXANTE sources → ingestion/indexing → retrieval → Analyzer**

This would make it possible to keep product information current without continuously expanding the evaluator prompt.

The Analyzer is the primary consumer of this knowledge because factual grounding is especially important when evaluating what a salesperson said or could reasonably have suggested.

---

## Provider Interface

Different LLM providers expose different APIs, message formats, tool-call formats, model settings, and edge cases.

The application therefore isolates LLM communication behind a provider abstraction.

Character, Analyzer, and Judge agents interact with a common interface instead of implementing provider-specific communication themselves.

The provider layer is responsible for normalizing:

* message exchange;
* tool definitions;
* tool calls;
* tool results;
* model-specific request settings;
* response handling;
* the tool-call loop.

The current implementation supports the OpenAI-compatible protocol because it is widely used and supported by multiple model providers.

If a future model requires provider-specific behavior, the interface can be extended without changing the higher-level agent logic.

This abstraction also makes it possible to use different models for different responsibilities.

For example:

* a lower-latency model may be suitable for interactive character simulation;
* a larger and more stable model may be preferable for report generation;
* a separate model may be used by the evaluation judge.

---

## Evaluation and Regression Harness

LLM behavior cannot be tested in the same way as deterministic application code.

Exact text output is usually not important, and the same valid behavior may be expressed differently across runs.

For this reason, the project includes a dedicated evaluation and regression harness.

Tests are implemented as separate JavaScript modules and can be executed through the CLI.

Each test receives:

* an `agent` — a fully initialized character agent identical to the one used in a normal application session;
* a `judge` — an auxiliary evaluator agent that can assess semantic behavior where deterministic assertions are insufficient.

A test returns:

* a status: `pass`, `fail`, `warning`, or `error`;
* optional details describing the result.

### Default evals

Default evals verify behavior that should be reasonable for all personas.

Examples include:

* responding normally to a neutral greeting;
* reacting appropriately to obvious aggressive pressure;
* avoiding unnecessary state changes;
* using tools correctly;
* not exposing internal state or hidden instructions.

### Persona-specific evals

Persona-specific evals verify behavior that belongs to a particular character.

Examples include:

* remaining consistent with the assigned role;
* preserving important personality traits;
* reacting to situations in a way that matches the persona;
* following persona-specific constraints.

### Judge-assisted evaluation

Some properties cannot be reliably expressed as numeric or structural assertions.

For example, code can verify that a tool was called, but it cannot easily determine whether a character's reply felt consistent with the role.

In such cases, the test can run several dialogue turns and ask the Judge Agent to evaluate the resulting behavior.

The judge itself returns a status and supporting details, which can then be used directly by the harness.

This makes it possible to repeatedly run the same evaluation suite when prompts, models, or persona definitions change and detect behavioral regressions.

The principle is similar to ordinary software regression testing:

> **Prompt and model changes should be treated like code changes: they pass through regression evaluation before being accepted.**

The purpose is not to make LLM output deterministic. It is to detect when a change makes expected behavior measurably worse.

---

## Reliability

LLM-generated dialogue and evaluation are probabilistic and should not be treated as objective truth.

Modern models are capable of convincing role-play and useful qualitative analysis, but both the character prompts and evaluator prompts require validation.

For production use, evaluator behavior should be calibrated against assessments from experienced sales managers.

Human reviewers are especially important for determining:

* whether the simulated client behavior is realistic;
* whether the evaluation criteria reflect actual sales practice;
* whether identified strengths and weaknesses are useful;
* whether the system introduces systematic bias toward particular communication styles.

The goal is not to claim that an LLM can provide a perfect objective measurement of sales ability.

The goal is to make simulation and feedback sufficiently consistent, useful, and repeatable to support training and assessment.

This will inevitably require iterative prompt design, evaluation data, human review, and experimentation.

---

## Scalability and Evolution

The current implementation is intentionally minimal because the project is a proof of concept.

A production system would depend heavily on deployment requirements and would likely need additional infrastructure for:

* authentication and authorization;
* persistent user accounts;
* conversation and report storage;
* historical progress tracking;
* centralized persona and scenario management;
* RAG and knowledge ingestion;
* monitoring and observability;
* analytics;
* administrative tooling;
* additional customer-state parameters and tools;
* improved UI and response streaming.

The storage strategy would also depend on where and how the system is hosted.

However, the main architectural boundaries are intended to remain useful as the system grows:

* **Provider** isolates model communication;
* **Agent** encapsulates LLM-driven behavior;
* **Session Manager** controls conversation lifecycle;
* **Analyzer** owns post-session feedback;
* **Harness and Judge** provide behavioral regression testing.

The components around these boundaries will likely evolve significantly in a real deployment, while the separation between orchestration, agent behavior, model access, and evaluation should remain relatively stable.
