# Installation

## 1. Clone the repository

```bash
git clone https://github.com/Tripod311/exante_test.git
cd exante_test
```

## 2. Configure the backend

Create a `configuration.json` file inside the `back` directory.

Copy the contents of:

```text
back/configuration-sample.json
```

into the new file and replace the example values with your actual configuration.

For example:

```json
{
	"client_dir": "../client",
	"port": 8080,
	"agents_dir": "../agents",
	"reports_dir": "../reports",
	"report_provider": "reporter",
	"judge_provider": "reporter",
	"providers": {
		"reporter": {
			"type": "openAI",
			"baseURL": "https://openrouter.ai/api/v1/chat/completions",
			"apiKey": "Your OpenRouter key",
			"model": "nvidia/nemotron-3.5-lightning:free"
		},
		"llama_local": {
			"type": "openAI",
			"baseURL": "http://127.0.0.1:14000/v1/chat/completions",
			"apiKey": "",
			"model": ""
		},
		"nvidia": {
			"type": "openAI",
			"baseURL": "https://openrouter.ai/api/v1/chat/completions",
			"apiKey": "Your OpenRouter key",
			"model": "nvidia/nemotron-3.5-lightning:free"
		}
	}
}
```

The `providers` section defines the available LLM providers. Provider names such as `reporter`, `llama_local`, and `nvidia` are arbitrary identifiers and can be referenced from other configuration files.

`report_provider` specifies which provider is used to generate post-conversation reports.

`judge_provider` specifies which provider is used by the evaluation and regression-testing system.

## 3. Configure the agents

Check the `agents` directory and make sure each agent is configured to use an available provider.

The repository includes a demo agent named **Daniel**.

For example, if the backend configuration contains a provider named:

```json
"nvidia": {
	"type": "openAI",
	"...": "..."
}
```

the Daniel agent configuration can reference `nvidia` as its provider.

The provider name used by an agent must match one of the providers defined in `back/configuration.json`.

## 4. Start the application

Run the startup script from the repository root:

```bash
./start.sh
```

The application UI will then be available locally on the port specified in `back/configuration.json`.

For example, with:

```json
"port": 8080
```

open:

```text
http://localhost:8080
```
