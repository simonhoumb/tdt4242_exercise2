import { beforeEach, describe, expect, it, vi } from "vitest";

const { usageLogModelMock } = vi.hoisted(() => ({
	usageLogModelMock: {
		create: vi.fn(),
		find: vi.fn(),
		deleteMany: vi.fn(),
	},
}));

vi.mock("../models/UsageLog.js", () => ({
	UsageLog: usageLogModelMock,
}));

import {
	createUsageLog,
	createUsageLogWithRetry,
	deleteUsageLogsByUserId,
	listUsageLogs,
} from "../services/loggingService.js";

describe("loggingService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it("createUsageLog delegates to model.create", async () => {
		const payload = { userId: "u1" };
		usageLogModelMock.create.mockResolvedValue({ _id: "1", ...payload });

		const result = await createUsageLog(payload);

		expect(usageLogModelMock.create).toHaveBeenCalledWith(payload);
		expect(result).toEqual({ _id: "1", userId: "u1" });
	});

	it("createUsageLogWithRetry retries after failures and succeeds", async () => {
		vi.useFakeTimers();
		usageLogModelMock.create
			.mockRejectedValueOnce(new Error("transient-1"))
			.mockRejectedValueOnce(new Error("transient-2"))
			.mockResolvedValueOnce({ _id: "ok" });

		const promise = createUsageLogWithRetry({ userId: "u1" }, 3);

		await vi.advanceTimersByTimeAsync(150);
		await vi.advanceTimersByTimeAsync(300);

		await expect(promise).resolves.toEqual({ _id: "ok" });
		expect(usageLogModelMock.create).toHaveBeenCalledTimes(3);
	});

	it("createUsageLogWithRetry throws last error when attempts are exhausted", async () => {
		vi.useFakeTimers();
		usageLogModelMock.create
			.mockRejectedValueOnce(new Error("fail-1"))
			.mockRejectedValueOnce(new Error("fail-2"));

		const promise = createUsageLogWithRetry({ userId: "u1" }, 2);
		const rejection = expect(promise).rejects.toThrow("fail-2");
		await vi.advanceTimersByTimeAsync(150);

		await rejection;
		expect(usageLogModelMock.create).toHaveBeenCalledTimes(2);
	});

	it("listUsageLogs builds filtered query and bounds limit", async () => {
		const lean = vi.fn().mockResolvedValue([{ id: 1 }]);
		const limit = vi.fn().mockReturnValue({ lean });
		const sort = vi.fn().mockReturnValue({ limit });
		usageLogModelMock.find.mockReturnValue({ sort });

		const result = await listUsageLogs({
			userId: "u1",
			courseId: "c1",
			assignmentId: "a1",
			limit: 500,
		});

		expect(usageLogModelMock.find).toHaveBeenCalledWith({
			userId: "u1",
			courseId: "c1",
			assignmentId: "a1",
		});
		expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
		expect(limit).toHaveBeenCalledWith(200);
		expect(result).toEqual([{ id: 1 }]);
	});

	it("listUsageLogs applies default lower bounded limit", async () => {
		const lean = vi.fn().mockResolvedValue([]);
		const limit = vi.fn().mockReturnValue({ lean });
		const sort = vi.fn().mockReturnValue({ limit });
		usageLogModelMock.find.mockReturnValue({ sort });

		await listUsageLogs({ limit: -1 });

		expect(usageLogModelMock.find).toHaveBeenCalledWith({});
		expect(limit).toHaveBeenCalledWith(1);
	});

	it("deleteUsageLogsByUserId returns deletedCount and defaults to zero", async () => {
		usageLogModelMock.deleteMany.mockResolvedValue({ deletedCount: 3 });
		await expect(deleteUsageLogsByUserId("u1")).resolves.toEqual({
			deletedCount: 3,
		});

		usageLogModelMock.deleteMany.mockResolvedValue({});
		await expect(deleteUsageLogsByUserId("u2")).resolves.toEqual({
			deletedCount: 0,
		});
	});
});
