const REPORT_AREAS = [
	"customer_understanding",
	"communication_quality",
	"trust_building",
	"product_knowledge",
	"objection_handling",
	"missed_opportunities",
	"next_steps"
] as const;

type ReportArea = typeof REPORT_AREAS[number];

function isRecord(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value)
	);
}

function validateObject(
	value: unknown,
	requiredKeys: readonly string[],
	path: string
): Record<string, unknown> {
	if (!isRecord(value)) {
		throw new Error(`${path} must be an object`);
	}

	const actualKeys = Object.keys(value);

	for (const key of requiredKeys) {
		if (!(key in value)) {
			throw new Error(`${path}.${key} is required`);
		}
	}

	for (const key of actualKeys) {
		if (!requiredKeys.includes(key)) {
			throw new Error(`${path}.${key} is not allowed`);
		}
	}

	return value;
}

function validateString(
	value: unknown,
	path: string,
	maxLength: number
): string {
	if (typeof value !== "string") {
		throw new Error(`${path} must be a string`);
	}

	const result = value.trim();

	if (result.length === 0) {
		throw new Error(`${path} must not be empty`);
	}

	if (result.length > maxLength) {
		throw new Error(
			`${path} must not exceed ${maxLength} characters`
		);
	}

	return result;
}

function validateScore(
	value: unknown,
	path: string
): 1 | 2 | 3 | 4 | 5 {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < 1 ||
		value > 5
	) {
		throw new Error(`${path} must be an integer from 1 to 5`);
	}

	return value as 1 | 2 | 3 | 4 | 5;
}

function validateEvidence(
	value: unknown,
	path: string,
	conversation: ReportMessageData[]
): ReportEvidence {
	const evidence = validateObject(
		value,
		["messageIndex", "explanation"],
		path
	);

	const { messageIndex } = evidence;

	if (
		typeof messageIndex !== "number" ||
		!Number.isInteger(messageIndex) ||
		messageIndex < 0 ||
		messageIndex >= conversation.length
	) {
		throw new Error(
			`${path}.messageIndex must reference an existing conversation message`
		);
	}

	const explanation = validateString(
		evidence.explanation,
		`${path}.explanation`,
		240
	);

	const message = conversation[messageIndex];

	if (!message) {
		throw new Error(
			`${path} does not occur in conversation[${messageIndex}].content`
		);
	}

	return {
		messageIndex,
		explanation
	};
}

function validateArea(
	value: unknown,
	path: string,
	conversation: ReportMessageData[]
): ReportAreaResult {
	const area = validateObject(
		value,
		["score", "summary", "evidence", "recommendation"],
		path
	);

	if (!Array.isArray(area.evidence)) {
		throw new Error(`${path}.evidence must be an array`);
	}

	if (area.evidence.length < 1 || area.evidence.length > 2) {
		throw new Error(
			`${path}.evidence must contain one or two items`
		);
	}

	return {
		score: validateScore(area.score, `${path}.score`),

		summary: validateString(
			area.summary,
			`${path}.summary`,
			240
		),

		evidence: area.evidence.map((evidence, index) =>
			validateEvidence(
				evidence,
				`${path}.evidence[${index}]`,
				conversation
			)
		),

		recommendation: validateString(
			area.recommendation,
			`${path}.recommendation`,
			240
		)
	};
}

function validateReportResult(
	value: unknown,
	conversation: ReportMessageData[]
): ReportResult {
	const report = validateObject(
		value,
		["schemaVersion", "overallSummary", "areas"],
		"report"
	);

	if (report.schemaVersion !== 1) {
		throw new Error("report.schemaVersion must be 1");
	}

	const rawAreas = validateObject(
		report.areas,
		REPORT_AREAS,
		"report.areas"
	);

	const areas: Record<ReportArea, ReportAreaResult> = {
		customer_understanding: validateArea(
			rawAreas.customer_understanding,
			"report.areas.customer_understanding",
			conversation
		),

		communication_quality: validateArea(
			rawAreas.communication_quality,
			"report.areas.communication_quality",
			conversation
		),

		trust_building: validateArea(
			rawAreas.trust_building,
			"report.areas.trust_building",
			conversation
		),

		product_knowledge: validateArea(
			rawAreas.product_knowledge,
			"report.areas.product_knowledge",
			conversation
		),

		objection_handling: validateArea(
			rawAreas.objection_handling,
			"report.areas.objection_handling",
			conversation
		),

		missed_opportunities: validateArea(
			rawAreas.missed_opportunities,
			"report.areas.missed_opportunities",
			conversation
		),

		next_steps: validateArea(
			rawAreas.next_steps,
			"report.areas.next_steps",
			conversation
		)
	};

	return {
		schemaVersion: 1,

		overallSummary: validateString(
			report.overallSummary,
			"report.overallSummary",
			500
		),

		areas
	};
}

export default class SubmitReportTool {
	public finalResult?: ReportResult;

	constructor(
		private readonly conversation: ReportMessageData[]
	) {}

	async submit(args: Record<string, unknown>) {
		const result = validateReportResult(
			args,
			this.conversation
		);

		this.finalResult = result;

		return JSON.stringify({
			success: true
		});
	}
}