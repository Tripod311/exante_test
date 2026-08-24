const BaseURL = `${window.location.protocol}//${window.location.host}/api`;

export interface APIResponse {
	error: boolean;
	details?: string;
	data?: unknown;
}

export {
	BaseURL
}