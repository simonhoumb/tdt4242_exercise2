export const assistanceTypeOptions = [
	"brainstorming",
	"editing",
	"translation",
	"code-review",
	"research",
	"summarization",
	"generation",
	"other",
];

export const defaultUsageLogDraft = {
	userId: "",
	courseId: "",
	assignmentId: "",
	toolName: "",
	assistanceType: "editing",
	contributionDescription: "",
	aiContributionPercent: 0,
	promptExcerpt: "",
};
