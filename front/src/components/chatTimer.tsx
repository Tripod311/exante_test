import { useEffect, useRef, useState } from "react";

interface TimerProps {
	remainingTime: number;
	started: boolean;
	onDeadline: () => void;
}

function formatTime(totalSeconds: number): string {
	const seconds = Math.max(0, Math.ceil(totalSeconds));

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainder = seconds % 60;

	if (hours > 0) {
		return [
			hours,
			minutes,
			remainder
		]
			.map(value => String(value).padStart(2, "0"))
			.join(":");
	}

	return [
		minutes,
		remainder
	]
		.map(value => String(value).padStart(2, "0"))
		.join(":");
}

export default function Timer({
	remainingTime,
	started,
	onDeadline
}: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(
		Math.max(0, remainingTime)
	);

	const deadlineCalled = useRef(false);

	useEffect(() => {
		setTimeLeft(Math.max(0, remainingTime));
		deadlineCalled.current = false;
	}, [remainingTime]);

	useEffect(() => {
		if (!started || timeLeft <= 0) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setTimeLeft(current => Math.max(0, current - 1));
		}, 1000);

		return () => {
			window.clearTimeout(timeout);
		};
	}, [started, timeLeft]);

	useEffect(() => {
		if (
			!started ||
			timeLeft > 0 ||
			deadlineCalled.current
		) {
			return;
		}

		deadlineCalled.current = true;
		onDeadline();
	}, [started, timeLeft, onDeadline]);

	const expired = timeLeft <= 0;

	return (
		<div
			role="timer"
			aria-live="polite"
			className={`rounded-lg border px-3 py-2 font-mono text-sm font-semibold ${
				expired
					? "border-red-200 bg-red-50 text-red-700"
					: timeLeft <= 60
						? "border-amber-200 bg-amber-50 text-amber-700"
						: "border-gray-200 bg-gray-50 text-gray-700"
			}`}
		>
			{expired ? "Time expired" : formatTime(timeLeft)}
		</div>
	);
}