export {};

declare global {
	interface Window {
		closeModals: () => void;
		showSpinner: () => void;
		showNotification: (heading?: string, message?: string, callback?: () => void) => void;
	}
}