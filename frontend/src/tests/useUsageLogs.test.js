import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createUsageLogMock = vi.hoisted(() => vi.fn());

vi.mock("../features/usage-compliance/services/usageApi", () => ({
	createUsageLog: createUsageLogMock,
}));

import { useUsageLogs } from "../features/usage-compliance/hooks/useUsageLogs";

describe("useUsageLogs", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("submits successfully and prepends logs", async () => {
		createUsageLogMock.mockResolvedValue({
			data: { id: "1", toolName: "ChatGPT" },
			compliance: { status: "ok" },
		});
		const { result } = renderHook(() => useUsageLogs());

		await act(async () => {
			const response = await result.current.submitUsageLog({
				userId: "u1",
				payload: { courseId: "c1" },
			});
			expect(response.compliance.status).toBe("ok");
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe("");
		expect(result.current.logs).toEqual([{ id: "1", toolName: "ChatGPT" }]);
	});

	it("sets friendly error and rethrows on failure", async () => {
		createUsageLogMock.mockRejectedValue(new Error("network down"));
		const { result } = renderHook(() => useUsageLogs());

		await act(async () => {
			await expect(
				result.current.submitUsageLog({
					userId: "u1",
					payload: {},
				}),
			).rejects.toThrow("network down");
		});

		await waitFor(() => {
			expect(result.current.error).toBe("network down");
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.logs).toEqual([]);
	});
});
