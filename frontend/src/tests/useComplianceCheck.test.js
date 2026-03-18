import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkComplianceDraftMock = vi.hoisted(() => vi.fn());

vi.mock("../features/usage-compliance/services/usageApi", () => ({
	checkComplianceDraft: checkComplianceDraftMock,
}));

import { useComplianceCheck } from "../features/usage-compliance/hooks/useComplianceCheck";

const completeDraft = {
	courseId: "TDT4242",
	assignmentId: "2",
	toolName: "ChatGPT",
	assistanceType: "editing",
	contributionDescription: "grammar help",
};

describe("useComplianceCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does nothing when draft is incomplete", async () => {
		const { result } = renderHook(() =>
			useComplianceCheck({ courseId: "TDT4242" }, 50),
		);

		expect(result.current.compliance).toBe(null);
		expect(result.current.error).toBe("");
		expect(result.current.isChecking).toBe(false);
		expect(checkComplianceDraftMock).not.toHaveBeenCalled();
	});

	it("fetches compliance after debounce when draft is complete", async () => {
		checkComplianceDraftMock.mockResolvedValue({ status: "ok" });
		const { result } = renderHook(() =>
			useComplianceCheck(completeDraft, 50),
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(50);
		});

		expect(checkComplianceDraftMock).toHaveBeenCalledWith(completeDraft);
		expect(result.current.compliance).toEqual({ status: "ok" });
		expect(result.current.error).toBe("");
		expect(result.current.isChecking).toBe(false);
	});

	it("sets error and clears compliance when request fails", async () => {
		checkComplianceDraftMock.mockRejectedValue(
			new Error("service unavailable"),
		);
		const { result } = renderHook(() =>
			useComplianceCheck(completeDraft, 50),
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(50);
		});

		expect(result.current.compliance).toBe(null);
		expect(result.current.error).toBe("service unavailable");
		expect(result.current.isChecking).toBe(false);
	});

	it("cancels previous request when draft changes rapidly", async () => {
		checkComplianceDraftMock
			.mockResolvedValueOnce({ status: "warning" })
			.mockResolvedValueOnce({ status: "ok" });

		const { result, rerender } = renderHook(
			({ draft }) => useComplianceCheck(draft, 50),
			{ initialProps: { draft: completeDraft } },
		);

		rerender({
			draft: {
				...completeDraft,
				contributionDescription: "updated draft",
			},
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(50);
		});

		expect(checkComplianceDraftMock).toHaveBeenCalledTimes(1);
		expect(result.current.compliance).toEqual({ status: "warning" });
	});
});
