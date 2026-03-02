import { PolicyRule } from "../models/PolicyRule.js";

export function buildPolicyRuleQuery({
	courseId,
	assignmentId,
	enabledOnly = false,
}) {
	const query = {};

	if (enabledOnly) {
		query.enabled = true;
	}

	if (courseId) {
		query.courseId = courseId;
	}

	if (assignmentId) {
		query.$or = [{ assignmentId }, { assignmentId: null }];
	}

	return query;
}

export async function listPolicyRules({
	courseId,
	assignmentId,
	enabledOnly = false,
}) {
	const query = buildPolicyRuleQuery({
		courseId,
		assignmentId,
		enabledOnly,
	});

	return PolicyRule.find(query).sort({ createdAt: -1 }).lean();
}
