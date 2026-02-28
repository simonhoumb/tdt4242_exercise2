import { formatComplianceStatus, safeViolationList } from "../utils/formatters";

export function ComplianceFeedbackPanel({
	title,
	loadingText,
	emptyText,
	checkErrorText,
	isChecking,
	compliance,
	checkError,
}) {
	const violations = safeViolationList(compliance);

	return (
		<section className="card" aria-live="polite">
			<h2>{title}</h2>
			{isChecking ? <p>{loadingText}</p> : null}
			{checkError ? (
				<p className="error">
					{checkErrorText}: {checkError}
				</p>
			) : null}

			{!isChecking && !checkError && !compliance ? (
				<p>{emptyText}</p>
			) : null}

			{compliance ? (
				<div>
					<p>
						<strong>Status:</strong>{" "}
						{formatComplianceStatus(compliance.status)}
					</p>
					<p>{compliance.educationalMessage}</p>

					{violations.map((violation) => (
						<article
							className="violation"
							key={`${violation.ruleId}-${violation.ruleName}`}
						>
							<h3>{violation.ruleName}</h3>
							<p>
								<strong>Rule:</strong> {violation.ruleId}
							</p>
							<p>{violation.explanation}</p>
							<p>
								<strong>Action:</strong>{" "}
								{violation.suggestedAction}
							</p>
							<p>
								<strong>Severity:</strong> {violation.severity}
							</p>
						</article>
					))}
				</div>
			) : null}
		</section>
	);
}
