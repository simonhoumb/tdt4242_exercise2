import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPolicyRulesMock } = vi.hoisted(() => ({
	listPolicyRulesMock: vi.fn(),
}));

vi.mock("../repositories/policyRuleRepository.js", () => ({
	listPolicyRules: listPolicyRulesMock,
}));

import {
	evaluateSubmissionCompliance,
	evaluateUsageLogCompliance,
} from "../services/complianceService.js";

function buildRule(overrides = {}) {
	return {
		ruleId: "R1",
		name: "Rule name",
		description: "Rule description",
		courseId: "TDT4242",
		assignmentId: "2",
		ruleType: "keyword_block",
		conditions: { keywords: ["forbidden"] },
		educationalMessage: "Educational message",
		suggestedAction: "Suggested action",
		severity: "high",
		updatedAt: "2024-01-01T00:00:00.000Z",
		...overrides,
	};
}

describe("evaluateUsageLogCompliance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NODE_ENV = "test";
	});

	it("returns ok when no rules are violated", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleType: "keyword_block",
				conditions: { keywords: ["forbidden"] },
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			assistanceType: "editing",
			contributionDescription: "Minor proofreading",
		});

		expect(result.status).toBe("ok");
		expect(result.violations).toHaveLength(0);
		expect(result.educationalMessage).toContain("appears aligned");
		expect(result.policyContext.ruleCount).toBe(1);
		expect(result.policyContext.lastUpdated).toBe(
			new Date("2024-01-01T00:00:00.000Z").getTime(),
		);
	});

	it("returns violation for blocked assistance type", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleType: "assistance_type_not_allowed",
				conditions: { blockedTypes: ["generation"] },
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			assistanceType: "generation",
		});

		expect(result.status).toBe("warning");
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].explanation).toContain(
			"Triggered by: generation",
		);
		expect(result.educationalMessage).toBe("Educational message");
	});

	it("uses warning fallback message when violation has no educational message", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleType: "required_field_non_empty",
				conditions: { field: "contributionDescription" },
				educationalMessage: "",
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			contributionDescription: "   ",
		});

		expect(result.status).toBe("warning");
		expect(result.educationalMessage).toContain("Great effort documenting");
	});

	it("evaluates max_ai_contribution branch and trigger formatting", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleType: "max_ai_contribution",
				conditions: { maxPercent: 40 },
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			aiContributionPercent: 55,
		});

		expect(result.status).toBe("warning");
		expect(result.violations[0].explanation).toContain("Triggered by: 55%");
	});

	it("evaluates keyword_block default fields and explicit fields", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleId: "R1",
				conditions: { keywords: ["copied"] },
			}),
			buildRule({
				ruleId: "R2",
				conditions: {
					keywords: ["private-token"],
					fields: ["responseExcerpt"],
				},
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			contributionDescription: "This text was copied from AI",
			responseExcerpt: "Contains private-token content",
		});

		expect(result.violations).toHaveLength(2);
	});

	it("skips unknown rule types", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({ ruleType: "unknown_type" }),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
		});

		expect(result.status).toBe("ok");
		expect(result.violations).toHaveLength(0);
	});

	it("handles malformed rule config and returns fallback violation", async () => {
		const malformedConditions = {};
		Object.defineProperty(malformedConditions, "field", {
			get() {
				throw new Error("bad config");
			},
		});

		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleId: "BROKEN",
				ruleType: "required_field_non_empty",
				conditions: malformedConditions,
			}),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
		});

		expect(result.status).toBe("warning");
		expect(result.violations[0].ruleId).toBe("BROKEN");
		expect(result.violations[0].ruleName).toContain("Rule");
		expect(result.violations[0].explanation).toContain(
			"malformed configuration",
		);
		expect(result.violations[0].debug.errorMessage).toBe("bad config");
	});

	it("calculates latest timestamp from createdAt or updatedAt", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({ updatedAt: "2024-01-01T00:00:00.000Z" }),
			buildRule({ ruleId: "R2", updatedAt: "2024-06-01T00:00:00.000Z" }),
		]);

		const result = await evaluateUsageLogCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
		});

		expect(result.policyContext.lastUpdated).toBe(
			new Date("2024-06-01T00:00:00.000Z").getTime(),
		);
	});
});

describe("evaluateSubmissionCompliance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listPolicyRulesMock.mockResolvedValue([]);
	});

	it("returns ok when all logs pass", async () => {
		const result = await evaluateSubmissionCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			logs: [{ contributionDescription: "Own work" }],
		});

		expect(result.status).toBe("ok");
		expect(result.educationalMessage).toContain("passed compliance");
		expect(result.results).toHaveLength(1);
	});

	it("returns warning when at least one log has warnings", async () => {
		listPolicyRulesMock.mockResolvedValue([
			buildRule({
				ruleType: "required_field_non_empty",
				conditions: { field: "contributionDescription" },
			}),
		]);

		const result = await evaluateSubmissionCompliance({
			courseId: "TDT4242",
			assignmentId: "2",
			logs: [
				{ contributionDescription: "" },
				{ contributionDescription: "ok" },
			],
		});

		expect(result.status).toBe("warning");
		expect(result.educationalMessage).toContain("Address the warnings");
		expect(result.results).toHaveLength(2);
	});
});
