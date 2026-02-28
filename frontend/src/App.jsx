import { useMemo, useState } from "react";
import { useComplianceCheck } from "./features/usage-compliance/hooks/useComplianceCheck";
import { useUsageLogs } from "./features/usage-compliance/hooks/useUsageLogs";
import { FeatureErrorBoundary } from "./features/usage-compliance/components/FeatureErrorBoundary";
import { UsageLogForm } from "./features/usage-compliance/components/UsageLogForm";
import { ComplianceFeedbackPanel } from "./features/usage-compliance/components/ComplianceFeedbackPanel";
import { EthicalGuidanceCard } from "./features/usage-compliance/components/EthicalGuidanceCard";

const guidanceText = {
	title: "Ethical AI Usage Guidance",
	message:
		"Use AI as a thinking partner, not a replacement for your own analysis.",
	points: [
		"Document what AI changed in your work.",
		"Preserve your own reasoning and decision-making process.",
		"Use AI for feedback, clarity, and iteration instead of full answer generation.",
	],
};

const formTexts = {
	title: "Document AI Usage",
	userId: "Student ID",
	courseId: "Course ID",
	assignmentId: "Assignment ID",
	toolName: "AI Tool Name",
	assistanceType: "Assistance Type",
	aiContributionPercent: "Estimated AI Contribution (%)",
	contributionDescription: "How AI contributed",
	promptExcerpt: "Prompt excerpt (optional)",
	submit: "Save usage log",
	submitting: "Saving...",
	submitErrorPrefix: "Submission failed",
};

const panelTexts = {
	title: "Compliance Feedback",
	loadingText: "Checking compliance...",
	emptyText: "Complete the form to receive live policy guidance.",
	checkErrorText: "Compliance check unavailable",
};

export default function App() {
	const [draftPayload, setDraftPayload] = useState({});
	const [latestCompliance, setLatestCompliance] = useState(null);
	const { logs, isLoading, error, submitUsageLog } = useUsageLogs();
	const {
		compliance,
		isChecking,
		error: checkError,
	} = useComplianceCheck(draftPayload, 600);

	const mergedCompliance = useMemo(
		() => latestCompliance || compliance,
		[latestCompliance, compliance],
	);

	async function handleSubmit({ userId, payload }) {
		const response = await submitUsageLog({ userId, payload });
		setLatestCompliance(response.compliance || null);
	}

	return (
		<main className="page">
			<h1>AI Usage Logging & Compliance</h1>

			<FeatureErrorBoundary fallbackText="Unable to load ethical guidance right now.">
				<EthicalGuidanceCard
					title={guidanceText.title}
					message={guidanceText.message}
					guidancePoints={guidanceText.points}
				/>
			</FeatureErrorBoundary>

			<FeatureErrorBoundary fallbackText="Unable to load usage form right now.">
				<UsageLogForm
					texts={formTexts}
					onSubmit={handleSubmit}
					isSubmitting={isLoading}
					submitError={error}
					onDraftChange={setDraftPayload}
				/>
			</FeatureErrorBoundary>

			<FeatureErrorBoundary fallbackText="Unable to render compliance feedback right now.">
				<ComplianceFeedbackPanel
					title={panelTexts.title}
					loadingText={panelTexts.loadingText}
					emptyText={panelTexts.emptyText}
					checkErrorText={panelTexts.checkErrorText}
					isChecking={isChecking}
					compliance={mergedCompliance}
					checkError={checkError}
				/>
			</FeatureErrorBoundary>

			<section className="card">
				<h2>Recent Usage Logs</h2>
				<p>Total logs: {logs.length}</p>
			</section>
		</main>
	);
}
