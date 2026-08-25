import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StateRow from "./stateRow.jsx";

import type { APIResponse } from "../api/config.js";
import getReport from "../api/getReport.js";

interface CustomerState {
	interest: number;
	trust: number;
	clarity: number;
	readiness: number;
}

type AgentConfiguration = Record<string, unknown>;

interface ReportMessageData {
	role: "user" | "assistant";
	content: string;
	impact?: CustomerState;
}

type ReportArea =
	| "customer_understanding"
	| "communication_quality"
	| "trust_building"
	| "product_knowledge"
	| "objection_handling"
	| "missed_opportunities"
	| "next_steps";

interface ReportEvidence {
	messageIndex: number;
	explanation: string;
}

interface ReportAreaResult {
	score: 1 | 2 | 3 | 4 | 5;
	summary: string;
	evidence: ReportEvidence[];
	recommendation: string;
}

interface ReportResult {
	schemaVersion: 1;
	overallSummary: string;
	areas: Record<ReportArea, ReportAreaResult>;
}

interface ReportData {
	role: string;
	initialState: CustomerState;
	finalState: CustomerState;
	stateDelta: CustomerState;
	conversation: ReportMessageData[];
	result?: ReportResult;
	agent_type: string;
}

const customerStateKeys: (keyof CustomerState)[] = [
	"interest",
	"trust",
	"clarity",
	"readiness"
];

const impactLabels: Record<keyof CustomerState, string> = {
	interest: "Interest",
	trust: "Trust",
	clarity: "Clarity",
	readiness: "Readiness"
};

const reportAreaOrder: ReportArea[] = [
	"customer_understanding",
	"communication_quality",
	"trust_building",
	"product_knowledge",
	"objection_handling",
	"missed_opportunities",
	"next_steps"
];

const reportAreaLabels: Record<ReportArea, string> = {
	customer_understanding: "Customer understanding",
	communication_quality: "Communication quality",
	trust_building: "Trust building",
	product_knowledge: "Product knowledge",
	objection_handling: "Objection handling",
	missed_opportunities: "Missed opportunities",
	next_steps: "Next steps"
};

const scoreClasses: Record<ReportAreaResult["score"], string> = {
	1: "border-red-200 bg-red-50 text-red-700",
	2: "border-orange-200 bg-orange-50 text-orange-700",
	3: "border-amber-200 bg-amber-50 text-amber-700",
	4: "border-blue-200 bg-blue-50 text-blue-700",
	5: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

function MessageImpact({
	impact
}: {
	impact: CustomerState | undefined;
}) {
	if (!impact) return null;

	const changes = (
		Object.entries(impact) as [keyof CustomerState, number][]
	).filter(([, value]) => value !== 0);

	if (changes.length === 0) return null;

	return (
		<div className="mt-2 flex flex-wrap gap-1.5">
			{changes.map(([key, value]) => {
				const positive = value > 0;

				return (
					<span
						key={key}
						className={
							positive
								? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
								: "rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
						}
					>
						{impactLabels[key]} {positive ? "+" : ""}
						{value}
					</span>
				);
			})}
		</div>
	);
}

function Score({ score }: { score: ReportAreaResult["score"] }) {
	return (
		<div className="flex items-center gap-2">
			<div
				className="flex gap-1"
				aria-label={`Score: ${score} out of 5`}
			>
				{[1, 2, 3, 4, 5].map((value) => (
					<span
						key={value}
						className={`h-2 w-2 rounded-full ${
							value <= score ? "bg-current" : "bg-gray-200"
						}`}
					/>
				))}
			</div>

			<span
				className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreClasses[score]}`}
			>
				{score}/5
			</span>
		</div>
	);
}

function AssessmentArea({
	area,
	result
}: {
	area: ReportArea;
	result: ReportAreaResult;
}) {
	const scrollToMessage = (messageIndex: number) => {
		document
			.getElementById(`conversation-message-${messageIndex}`)
			?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
	};

	return (
		<article className="rounded-xl border border-gray-200 bg-white p-5">
			<div className="flex items-start justify-between gap-4">
				<h3 className="font-semibold text-gray-900">
					{reportAreaLabels[area]}
				</h3>

				<Score score={result.score} />
			</div>

			<p className="mt-3 text-sm leading-6 text-gray-700">
				{result.summary}
			</p>

			{result.evidence.length > 0 && (
				<div className="mt-4">
					<h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
						Evidence
					</h4>

					<div className="mt-2 flex flex-col gap-3">
						{result.evidence.map((evidence, index) => (
							<div
								key={`${evidence.messageIndex}-${index}`}
								className="rounded-lg border border-gray-100 bg-gray-50 p-3"
							>
								<button
									type="button"
									onClick={() =>
										scrollToMessage(evidence.messageIndex)
									}
									className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
								>
									Message #{evidence.messageIndex + 1}
								</button>

								<p className="mt-2 text-sm leading-5 text-gray-600">
									{evidence.explanation}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
				<h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
					Recommendation
				</h4>

				<p className="mt-1 text-sm leading-5 text-blue-900">
					{result.recommendation}
				</p>
			</div>
		</article>
	);
}

export default function Report() {
	const { chatId } = useParams();
	const navigate = useNavigate();

	const [report, setReport] = useState<ReportData>();

	useEffect(() => {
		if (!chatId) {
			navigate("/", { replace: true });
			return;
		}

		let cancelled = false;

		window.showSpinner();

		getReport(chatId)
			.then((response: APIResponse) => {
				if (cancelled) return;

				window.closeModals();

				if (response.error) {
					window.showNotification(
						"Error",
						response.details,
						() => {
							window.closeModals();
							navigate("/");
						}
					);

					return;
				}

				setReport(response.data as ReportData);
			})
			.catch((error: unknown) => {
				if (cancelled) return;

				window.closeModals();

				window.showNotification(
					"Error",
					error instanceof Error
						? error.message
						: "Failed to load report",
					() => {
						window.closeModals();
						navigate("/");
					}
				);
			});

		return () => {
			cancelled = true;
		};
	}, [chatId, navigate]);

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
	};

	return (
		<div className="flex h-full w-full flex-col bg-gray-50">
			<header className="border-b border-gray-200 bg-white px-6 py-4">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
					<div>
						<h1 className="text-lg font-semibold text-gray-900">
							Conversation report
						</h1>

						<p className="mt-1 text-sm text-gray-500">
							Chat ID: {chatId}
							{report && ` · Agent: ${report.agent_type}`}
						</p>
					</div>

					<button
						type="button"
						onClick={copyLink}
						className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
					>
						Copy link
					</button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				{report && (
					<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6">
						<section className="rounded-xl border border-gray-200 bg-white p-5">
							<h2 className="mb-4 text-sm font-semibold text-gray-900">
								Customer state
							</h2>

							<div className="flex flex-col divide-y divide-gray-100">
								{customerStateKeys.map((key) => (
									<StateRow
										key={key}
										label={key}
										initial={report.initialState[key]}
										final={report.finalState[key]}
										delta={report.stateDelta[key]}
									/>
								))}
							</div>
						</section>

						<section>
							<h2 className="text-sm font-semibold text-gray-900">
								AI assessment
							</h2>

							{report.result ? (
								<>
									<div className="mt-3 rounded-xl border border-gray-200 bg-white p-5">
										<h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
											Overall summary
										</h3>

										<p className="mt-2 text-sm leading-6 text-gray-700">
											{report.result.overallSummary}
										</p>
									</div>

									<div className="mt-4 flex flex-col gap-4">
										{reportAreaOrder.map((area) => (
											<AssessmentArea
												key={area}
												area={area}
												result={
													report.result!.areas[area]
												}
											/>
										))}
									</div>
								</>
							) : (
								<div className="mt-3 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
									Assessment is not available.
								</div>
							)}
						</section>

						<section className="rounded-xl border border-gray-200 bg-white">
							<div className="border-b border-gray-200 px-5 py-4">
								<h2 className="text-sm font-semibold text-gray-900">
									Conversation
								</h2>
							</div>

							<div className="flex flex-col gap-4 p-5">
								{report.conversation.map((message, index) => {
									const isAssistant =
										message.role === "assistant";

									return (
										<div
											id={`conversation-message-${index}`}
											key={index}
											className={`flex scroll-mt-6 ${
												isAssistant
													? "justify-start"
													: "justify-end"
											}`}
										>
											<div className="max-w-[80%]">
												<div
													className={`rounded-xl px-4 py-3 text-sm leading-6 ${
														isAssistant
															? "bg-gray-100 text-gray-800"
															: "bg-gray-900 text-white"
													}`}
												>
													{message.content}
												</div>

												<MessageImpact
													impact={message.impact}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</section>
					</main>
				)}
			</div>
		</div>
	);
}