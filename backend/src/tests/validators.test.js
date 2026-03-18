import { describe, expect, it } from "vitest";
import {
	sanitizeString,
	validatePolicyPayload,
	validateUsageLogPayload,
} from "../utils/validators.js";

describe("sanitizeString", () => {
	it("returns trimmed string for valid input", () => {
		expect(sanitizeString("  hello  ")).toBe("hello");
	});

	it("returns empty string for non-string values", () => {
		expect(sanitizeString(null)).toBe("");
		expect(sanitizeString(123)).toBe("");
		expect(sanitizeString(undefined)).toBe("");
	});
});

describe("validateUsageLogPayload", () => {
	const validPayload = {
		courseId: "TDT4242",
		assignmentId: "2",
		toolName: "ChatGPT",
		assistanceType: "editing",
		contributionDescription: "Grammar edits",
		aiContributionPercent: 20,
	};

	it("accepts a valid payload", () => {
		expect(validateUsageLogPayload(validPayload)).toEqual({ valid: true });
	});

	it("returns missing required fields", () => {
		const result = validateUsageLogPayload({
			...validPayload,
			toolName: "  ",
			assistanceType: undefined,
		});

		expect(result.valid).toBe(false);
		expect(result.message).toContain("toolName");
		expect(result.message).toContain("assistanceType");
	});

	it("rejects non-finite aiContributionPercent", () => {
		const result = validateUsageLogPayload({
			...validPayload,
			aiContributionPercent: "not-a-number",
		});

		expect(result).toEqual({
			valid: false,
			message: "aiContributionPercent must be between 0 and 100",
		});
	});

	it("rejects out of range aiContributionPercent", () => {
		expect(
			validateUsageLogPayload({
				...validPayload,
				aiContributionPercent: -1,
			}),
		).toEqual({
			valid: false,
			message: "aiContributionPercent must be between 0 and 100",
		});

		expect(
			validateUsageLogPayload({
				...validPayload,
				aiContributionPercent: 101,
			}),
		).toEqual({
			valid: false,
			message: "aiContributionPercent must be between 0 and 100",
		});
	});
});

describe("validatePolicyPayload", () => {
	const validPolicy = {
		ruleId: "NO_GEN",
		name: "No full generation",
		description: "Do not fully generate answers",
		courseId: "TDT4242",
		ruleType: "keyword_block",
		educationalMessage: "Use AI for support",
		suggestedAction: "Rewrite in your own words",
	};

	it("accepts a valid policy payload", () => {
		expect(validatePolicyPayload(validPolicy)).toEqual({ valid: true });
	});

	it("returns missing required fields", () => {
		const result = validatePolicyPayload({
			...validPolicy,
			description: "",
			ruleType: " ",
		});

		expect(result.valid).toBe(false);
		expect(result.message).toContain("description");
		expect(result.message).toContain("ruleType");
	});
});
