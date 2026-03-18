import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UsageLogForm } from "../features/usage-compliance/components/UsageLogForm";

const texts = {
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

describe("UsageLogForm", () => {
	it("keeps submit disabled until required fields are completed", async () => {
		const user = userEvent.setup();
		render(
			<UsageLogForm
				texts={texts}
				onSubmit={vi.fn()}
				isSubmitting={false}
				submitError=""
				onDraftChange={vi.fn()}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: texts.submit });
		expect(submitButton).toBeDisabled();

		await user.type(screen.getByLabelText(texts.userId), "s123");
		await user.type(screen.getByLabelText(texts.courseId), "TDT4242");
		await user.type(screen.getByLabelText(texts.assignmentId), "2");
		await user.type(screen.getByLabelText(texts.toolName), "ChatGPT");
		await user.type(
			screen.getByLabelText(texts.contributionDescription),
			"Grammar",
		);

		expect(submitButton).toBeEnabled();
	});

	it("calls onDraftChange and submits normalized payload", async () => {
		const user = userEvent.setup();
		const onDraftChange = vi.fn();
		const onSubmit = vi.fn().mockResolvedValue(undefined);

		render(
			<UsageLogForm
				texts={texts}
				onSubmit={onSubmit}
				isSubmitting={false}
				submitError=""
				onDraftChange={onDraftChange}
			/>,
		);

		await user.type(screen.getByLabelText(texts.userId), "s123");
		await user.type(screen.getByLabelText(texts.courseId), "TDT4242");
		await user.type(screen.getByLabelText(texts.assignmentId), "2");
		await user.type(screen.getByLabelText(texts.toolName), "ChatGPT");
		fireEvent.change(screen.getByLabelText(texts.aiContributionPercent), {
			target: { value: "25" },
		});
		await user.type(
			screen.getByLabelText(texts.contributionDescription),
			"Grammar",
		);
		await user.type(
			screen.getByLabelText(texts.promptExcerpt),
			"help me refine",
		);

		await user.click(screen.getByRole("button", { name: texts.submit }));

		expect(onDraftChange).toHaveBeenCalled();
		expect(onSubmit).toHaveBeenCalledWith({
			userId: "s123",
			payload: {
				courseId: "TDT4242",
				assignmentId: "2",
				toolName: "ChatGPT",
				assistanceType: "editing",
				contributionDescription: "Grammar",
				aiContributionPercent: 25,
				promptExcerpt: "help me refine",
			},
		});
	});

	it("shows submit error and submitting state text", () => {
		render(
			<UsageLogForm
				texts={texts}
				onSubmit={vi.fn()}
				isSubmitting
				submitError="API unavailable"
				onDraftChange={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(/Submission failed: API unavailable/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: texts.submitting }),
		).toBeDisabled();
	});
});
