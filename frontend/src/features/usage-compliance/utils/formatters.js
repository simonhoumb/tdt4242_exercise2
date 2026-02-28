export function formatComplianceStatus(status) {
	if (status === "warning") {
		return "Needs attention";
	}

	if (status === "ok") {
		return "Compliant";
	}

	return "Pending";
}

export function safeViolationList(compliance) {
	if (!Array.isArray(compliance?.violations)) {
		return [];
	}

	return compliance.violations;
}
