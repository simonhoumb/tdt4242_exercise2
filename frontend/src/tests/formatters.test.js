import { describe, expect, it } from "vitest";
import {
	formatComplianceStatus,
	safeViolationList,
} from "../features/usage-compliance/utils/formatters";

describe("formatComplianceStatus", () => {
	it("maps warning to Needs attention", () => {
		expect(formatComplianceStatus("warning")).toBe("Needs attention");
	});

	it("maps ok to Compliant", () => {
		expect(formatComplianceStatus("ok")).toBe("Compliant");
	});

	it("falls back to Pending for unknown values", () => {
		expect(formatComplianceStatus("anything-else")).toBe("Pending");
	});
});

describe("safeViolationList", () => {
	it("returns violations when input list is valid", () => {
		const violations = [{ ruleId: "R1" }];
		expect(safeViolationList({ violations })).toEqual(violations);
	});

	it("returns empty list when violations is missing or invalid", () => {
		expect(safeViolationList(null)).toEqual([]);
		expect(safeViolationList({ violations: "not-array" })).toEqual([]);
	});
});
