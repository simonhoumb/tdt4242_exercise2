import { beforeEach, describe, expect, it, vi } from "vitest";

const { policyRuleModelMock } = vi.hoisted(() => ({
	policyRuleModelMock: {
		find: vi.fn(),
	},
}));

vi.mock("../models/PolicyRule.js", () => ({
	PolicyRule: policyRuleModelMock,
}));

import {
	buildPolicyRuleQuery,
	listPolicyRules,
} from "../repositories/policyRuleRepository.js";

describe("buildPolicyRuleQuery", () => {
	it("builds empty query when no filters are provided", () => {
		expect(buildPolicyRuleQuery({})).toEqual({});
	});

	it("adds enabled filter when enabledOnly is true", () => {
		expect(buildPolicyRuleQuery({ enabledOnly: true })).toEqual({
			enabled: true,
		});
	});

	it("adds course and assignment filters", () => {
		expect(
			buildPolicyRuleQuery({
				courseId: "TDT4242",
				assignmentId: "2",
				enabledOnly: true,
			}),
		).toEqual({
			enabled: true,
			courseId: "TDT4242",
			$or: [{ assignmentId: "2" }, { assignmentId: null }],
		});
	});
});

describe("listPolicyRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("queries model and returns lean sorted results", async () => {
		const lean = vi.fn().mockResolvedValue([{ ruleId: "R1" }]);
		const limitChain = { lean };
		const sort = vi.fn().mockReturnValue(limitChain);
		policyRuleModelMock.find.mockReturnValue({ sort });

		const result = await listPolicyRules({
			courseId: "TDT4242",
			assignmentId: "2",
			enabledOnly: true,
		});

		expect(policyRuleModelMock.find).toHaveBeenCalledWith({
			enabled: true,
			courseId: "TDT4242",
			$or: [{ assignmentId: "2" }, { assignmentId: null }],
		});
		expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
		expect(lean).toHaveBeenCalled();
		expect(result).toEqual([{ ruleId: "R1" }]);
	});
});
