import { useState } from "react"
import type { ReactNode } from "react"

import SpinnerDialog from "./spinnerDialog.jsx"
import NotificationDialog from "./notificationDialog.js"

export default function Overlay () {
	const [ dialog, setDialog ] = useState<ReactNode | null>(null);

	window.showSpinner = () => {
		const spinner = <SpinnerDialog />;
		setDialog(spinner);
	}

	window.showNotification = (heading: string, message: string, onClose?: () => void) => {
		const dialog = <NotificationDialog heading={heading} message={message} onClose={onClose} />;
		setDialog(dialog);
	}

	window.closeModals = () => {
		setDialog(null);
	}

	return <div className="top-0 left-0 w-full h-full fixed flex flex-col justify-center items-center" style={{ "pointer-events": dialog === null ? "none" : "all" }}>
		{ dialog !== null ? <div className="w-full h-full bg-black/50 absolute"></div> : null }
		{ dialog }
	</div>
}