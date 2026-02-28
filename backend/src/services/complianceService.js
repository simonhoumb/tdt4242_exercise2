import { PolicyRule } from "../models/PolicyRule.js";

function safeString(value) {
	return typeof value === "string" ? value.toLowerCase() : "";
}

const evaluators = {
	assistance_type_not_allowed: ({ usageLog, rule }) => {
		const blockedTypes = Array.isArray(rule.conditions?.blockedTypes)
			? rule.conditions.blockedTypes
			: [];
		const blockedSet = new Set(
			blockedTypes.map((item) => safeString(item)),
		);
		const violates = blockedSet.has(safeString(usageLog.assistanceType));
		return { violates, trigger: usageLog.assistanceType };
	},
	required_field_non_empty: ({ usageLog, rule }) => {
		const requiredField = rule.conditions?.field;
		const value = usageLog?.[requiredField];
		const violates = typeof value !== "string" || value.trim().length === 0;
		return { violates, trigger: requiredField };
	},
	max_ai_contribution: ({ usageLog, rule }) => {
		const maxAllowed = Number(rule.conditions?.maxPercent ?? 100);
		const contribution = Number(usageLog.aiContributionPercent ?? 0);
		const violates =
			Number.isFinite(contribution) && contribution > maxAllowed;
		return { violates, trigger: `${contribution}%` };
	},
	keyword_block: ({ usageLog, rule }) => {
		const keywords = Array.isArray(rule.conditions?.keywords)
			? rule.conditions.keywords
			: [];
		const fields =
			Array.isArray(rule.conditions?.fields) &&
			rule.conditions.fields.length > 0
				? rule.conditions.fields
				: [
						"contributionDescription",
						"promptExcerpt",
						"responseExcerpt",
					];

		const combinedText = fields
			.map((fieldName) => usageLog?.[fieldName])
			.filter((value) => typeof value === "string")
			.join(" ")
			.toLowerCase();

		const match = keywords.find((keyword) =>
			combinedText.includes(String(keyword).toLowerCase()),
		);
		return { violates: Boolean(match), trigger: match || null };
	},
};

function toViolation(rule, trigger) {
	return {
		ruleId: rule.ruleId,
		ruleName: rule.name,
		explanation: `${rule.description}${trigger ? ` Triggered by: ${trigger}.` : ""}`,
		suggestedAction: rule.suggestedAction,
		severity: rule.severity || "medium",
	};
}

function malformedRuleViolation(rule) {
	return {
		ruleId: rule.ruleId || "UNKNOWN_RULE",
		ruleName: rule.name || "Rule unavailable",
		explanation:
			"A policy rule could not be evaluated due to malformed configuration. Please contact course staff.",
		suggestedAction:
			"Retry later and inform your instructor if the issue persists.",
		severity: "low",
	};
}

export async function listPolicyRules({ courseId, assignmentId }) {
	const query = { enabled: true };
	if (courseId) {
		query.courseId = courseId;
	}

	if (assignmentId) {
		query.$or = [{ assignmentId }, { assignmentId: null }];
	}

	return PolicyRule.find(query).sort({ createdAt: -1 }).lean();
}

export async function evaluateUsageLogCompliance(usageLogInput) {
	const rules = await listPolicyRules({
		courseId: usageLogInput.courseId,
		assignmentId: usageLogInput.assignmentId,
	});

	const violations = [];

	for (const rule of rules) {
		try {
			const evaluator = evaluators[rule.ruleType];
			if (!evaluator) {
				continue;
			}

			const evaluation = evaluator({ usageLog: usageLogInput, rule });
			if (evaluation.violates) {
				violations.push(toViolation(rule, evaluation.trigger));
			}
		} catch (error) {
			violations.push(malformedRuleViolation(rule));
		}
	}

	const status = violations.length > 0 ? "warning" : "ok";
	const educationalMessage =
		violations.length > 0
			? "Great effort documenting your AI usage. Keep strengthening your independent thinking by applying the feedback below."
			: "Great job. Your AI usage appears aligned with current course policy.";

	return {
		status,
		educationalMessage,
		violations,
		policyContext: {
			courseId: usageLogInput.courseId,
			assignmentId: usageLogInput.assignmentId,
			ruleCount: rules.length,
			lastUpdated: rules.reduce((latest, rule) => {
				const timestamp = new Date(
					rule.updatedAt || rule.createdAt || 0,
				).getTime();
				return timestamp > latest ? timestamp : latest;
			}, 0),
		},
	};
}

export async function evaluateSubmissionCompliance({
	courseId,
	assignmentId,
	logs,
}) {
	const results = [];
	for (const logItem of logs) {
		const compliance = await evaluateUsageLogCompliance({
			...logItem,
			courseId,
			assignmentId,
		});
		results.push({ log: logItem, compliance });
	}

	const hasWarnings = results.some(
		(result) => result.compliance.status === "warning",
	);
	return {
		status: hasWarnings ? "warning" : "ok",
		educationalMessage: hasWarnings
			? "You are close to compliant submission. Address the warnings and resubmit."
			: "All logs passed compliance checks.",
		results,
	};
}
