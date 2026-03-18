import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkComplianceDraft,
	createUsageLog,
} from "../features/usage-compliance/services/usageApi";

describe("usageApi", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("createUsageLog sends normalized payload and x-user-id header", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			json: async () => ({ data: { id: 1 } }),
		});

		const result = await createUsageLog({
			userId: "u1",
			payload: {
				payload: {
					courseId: "c1",
					assignmentId: "a1",
				},
			},
		});

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/logs"),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ "x-user-id": "u1" }),
				body: JSON.stringify({ courseId: "c1", assignmentId: "a1" }),
			}),
		);
		expect(result).toEqual({ data: { id: 1 } });
	});

	it("checkComplianceDraft sends normalized payload", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			json: async () => ({ status: "ok" }),
		});

		await checkComplianceDraft({ payload: { toolName: "ChatGPT" } });

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/logs/compliance/check"),
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ toolName: "ChatGPT" }),
			}),
		);
	});

	it("retries retryable failures and then succeeds", async () => {
		global.fetch
			.mockRejectedValueOnce(new Error("temporary-1"))
			.mockRejectedValueOnce(new Error("temporary-2"))
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: "ok" }),
			});

		const promise = checkComplianceDraft({ toolName: "x" });
		await vi.advanceTimersByTimeAsync(200);
		await vi.advanceTimersByTimeAsync(400);

		await expect(promise).resolves.toEqual({ status: "ok" });
		expect(global.fetch).toHaveBeenCalledTimes(3);
	});

	it("does not retry non-retryable status and surfaces API message", async () => {
		global.fetch.mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({
				error: { message: "Invalid payload" },
			}),
		});

		await expect(checkComplianceDraft({})).rejects.toThrow(
			"Invalid payload",
		);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("maps AbortError to Request cancelled", async () => {
		const abortError = new Error("aborted");
		abortError.name = "AbortError";
		global.fetch.mockRejectedValue(abortError);

		const promise = checkComplianceDraft({ toolName: "x" });
		const rejection = expect(promise).rejects.toThrow("Request cancelled");
		await vi.advanceTimersByTimeAsync(200);
		await vi.advanceTimersByTimeAsync(400);

		await rejection;
	});
});
