import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComplianceFeedbackPanel } from "../features/usage-compliance/components/ComplianceFeedbackPanel";

const baseProps = {
	title: "Compliance Feedback",
	loadingText: "Checking...",
	emptyText: "Fill form",
	checkErrorText: "Unavailable",
	isChecking: false,
	compliance: null,
	checkError: "",
};

describe("ComplianceFeedbackPanel", () => {
	it("shows loading state", () => {
		render(<ComplianceFeedbackPanel {...baseProps} isChecking />);
		expect(screen.getByText("Checking...")).toBeInTheDocument();
	});

	it("shows check error", () => {
		render(
			<ComplianceFeedbackPanel
				{...baseProps}
				checkError="Network issue"
			/>,
		);
		expect(
			screen.getByText(/Unavailable: Network issue/),
		).toBeInTheDocument();
	});

	it("shows empty state when no compliance", () => {
		render(<ComplianceFeedbackPanel {...baseProps} />);
		expect(screen.getByText("Fill form")).toBeInTheDocument();
	});

	it("renders compliance summary and violations", () => {
		render(
			<ComplianceFeedbackPanel
				{...baseProps}
				compliance={{
					status: "warning",
					educationalMessage: "Improve originality",
					violations: [
						{
							ruleId: "R1",
							ruleName: "No full generation",
							explanation: "Generated too much content",
							suggestedAction: "Rewrite in own words",
							severity: "high",
						},
					],
				}}
			/>,
		);

		expect(screen.getByText("Needs attention")).toBeInTheDocument();
		expect(screen.getByText("Improve originality")).toBeInTheDocument();
		expect(screen.getByText("No full generation")).toBeInTheDocument();
		expect(screen.getByText("R1")).toBeInTheDocument();
		expect(screen.getByText("Rewrite in own words")).toBeInTheDocument();
	});
});
