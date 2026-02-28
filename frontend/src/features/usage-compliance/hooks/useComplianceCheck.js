import { useEffect, useState } from "react";
import { checkComplianceDraft } from "../services/usageApi";

export function useComplianceCheck(draftPayload, debounceMs = 600) {
	const [compliance, setCompliance] = useState(null);
	const [isChecking, setIsChecking] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const requiredKeys = [
			"courseId",
			"assignmentId",
			"toolName",
			"assistanceType",
			"contributionDescription",
		];
		const isDraftComplete = requiredKeys.every((key) => {
			const value = draftPayload?.[key];
			return typeof value === "string"
				? value.trim().length > 0
				: value !== undefined && value !== null;
		});

		if (!isDraftComplete) {
			setCompliance(null);
			setError("");
			setIsChecking(false);
			return undefined;
		}

		let cancelled = false;
		const timerId = setTimeout(async () => {
			setIsChecking(true);
			setError("");
			try {
				const result = await checkComplianceDraft(draftPayload);
				if (!cancelled) {
					setCompliance(result);
				}
			} catch (requestError) {
				if (!cancelled) {
					setError(requestError.message || "Compliance check failed");
					setCompliance(null);
				}
			} finally {
				if (!cancelled) {
					setIsChecking(false);
				}
			}
		}, debounceMs);

		return () => {
			cancelled = true;
			clearTimeout(timerId);
		};
	}, [draftPayload, debounceMs]);

	return {
		compliance,
		isChecking,
		error,
	};
}
