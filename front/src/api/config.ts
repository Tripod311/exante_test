const BaseURL = "http://127.0.0.1:8080/api"

export interface APIResponse {
	error: boolean;
	details?: string;
	data?: unknown;
}

export {
	BaseURL
}