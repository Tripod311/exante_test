import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import StateRow from "./stateRow.jsx"

import getReport from "../api/getReport.js"

interface CustomerState {
	interest: number;
	trust: number;
	clarity: number;
	readiness: number;
}

interface ReportMessageData {
	role: "user" | "assistant";
	content: string;
}

interface ReportData {
	agent_type: string;
	role: string;
	initialState: CustomerState;
	finalState: CustomerState;
	stateDelta: CustomerState;
	conversation: ReportMessageData[];
	result: string;
}

export default function Report() {
	const { chatId } = useParams();
	const navigate = useNavigate();
	const [ report, setReport ] = useState<ReportData | undefined>(undefined);

	useEffect(() => {
		window.showSpinner();

		getReport(chatId).then(
			(response: APIResponse) => {
				window.closeModals();

				if (response.error) {
					window.showNotification("Error", response.details, () => {
						window.closeModals();
						navigate("/");
					});
				} else {
					setReport(response.data);
				}
			}
		);
	}, []);

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
	};

	return (
		<div className="flex h-full w-full flex-col bg-gray-50">
			<header className="border-b border-gray-200 bg-white px-6 py-4">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-gray-900">
							Conversation report
						</h1>
						<p className="mt-1 text-sm text-gray-500">
							Chat id: {chatId}, Agent: {report?.agent_type}
						</p>
					</div>

					<button
						onClick={copyLink}
						className="
							rounded-lg border border-slate-200
							bg-white px-4 py-2
							text-sm font-medium text-slate-600
							transition
							hover:bg-slate-50
							active:scale-[0.98]
						"
					>
						Copy link
					</button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6">

					<section className="rounded-xl border border-gray-200 bg-white p-5">
						<h2 className="mb-4 text-sm font-semibold text-gray-900">
							Customer state
						</h2>

						<div className="flex flex-col divide-y divide-gray-100">
							{
								report === undefined ? null : Object.keys(report?.stateDelta).map((key: string) => {
									return <StateRow
										key={key}
										label={key}
										initial={report?.initialState[key]}
										final={report?.finalState[key]}
										delta={report?.stateDelta[key]}
									/>
								})
							}
						</div>
					</section>

					<section className="rounded-xl border border-gray-200 bg-white p-5">
						<h2 className="mb-3 text-sm font-semibold text-gray-900">
							AI assessment
						</h2>

						<div className="prose">
							<Markdown>
								{report?.result}
							</Markdown>
						</div>
					</section>

					<section className="rounded-xl border border-gray-200 bg-white">
						<div className="border-b border-gray-200 px-5 py-4">
							<h2 className="text-sm font-semibold text-gray-900">
								Conversation
							</h2>
						</div>

						<div className="flex flex-col gap-4 p-5">
							{report?.conversation.map((message, index) =>
								message.role === "assistant" ? (
									<div
										key={index}
										className="flex justify-start"
									>
										<div className="max-w-[80%] rounded-xl bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800">
											{message.content}
										</div>
									</div>
								) : (
									<div
										key={index}
										className="flex justify-end"
									>
										<div className="max-w-[80%] rounded-xl bg-gray-900 px-4 py-3 text-sm leading-6 text-white">
											{message.content}
										</div>
									</div>
								)
							)}
						</div>
					</section>

				</main>
			</div>
		</div>
	);
}