export function sanitizeString(value) {
	if (typeof value !== "string") {
		return "";
	}

	return value.trim();
}

export function validateUsageLogPayload(payload) {
	const requiredFields = [
		"courseId",
		"assignmentId",
		"toolName",
		"assistanceType",
		"contributionDescription",
	];
	const missingFields = requiredFields.filter(
		(fieldName) => !sanitizeString(payload?.[fieldName]),
	);

	if (missingFields.length > 0) {
		return {
			valid: false,
			message: `Missing required fields: ${missingFields.join(", ")}`,
		};
	}

	const aiContributionPercent = Number(payload.aiContributionPercent ?? 0);
	if (
		!Number.isFinite(aiContributionPercent) ||
		aiContributionPercent < 0 ||
		aiContributionPercent > 100
	) {
		return {
			valid: false,
			message: "aiContributionPercent must be between 0 and 100",
		};
	}

	return { valid: true };
}

export function validatePolicyPayload(payload) {
	const requiredFields = [
		"ruleId",
		"name",
		"description",
		"courseId",
		"ruleType",
		"educationalMessage",
		"suggestedAction",
	];

	const missingFields = requiredFields.filter(
		(fieldName) => !sanitizeString(payload?.[fieldName]),
	);

	if (missingFields.length > 0) {
		return {
			valid: false,
			message: `Missing required fields: ${missingFields.join(", ")}`,
		};
	}

	return { valid: true };
}
