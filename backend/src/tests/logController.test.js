import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/errorHandler.js";

const {
	validateUsageLogPayloadMock,
	createUsageLogWithRetryMock,
	deleteUsageLogsByUserIdMock,
	listUsageLogsMock,
	evaluateSubmissionComplianceMock,
	evaluateUsageLogComplianceMock,
} = vi.hoisted(() => ({
	validateUsageLogPayloadMock: vi.fn(),
	createUsageLogWithRetryMock: vi.fn(),
	deleteUsageLogsByUserIdMock: vi.fn(),
	listUsageLogsMock: vi.fn(),
	evaluateSubmissionComplianceMock: vi.fn(),
	evaluateUsageLogComplianceMock: vi.fn(),
}));

vi.mock("../utils/validators.js", () => ({
	validateUsageLogPayload: validateUsageLogPayloadMock,
}));

vi.mock("../services/loggingService.js", () => ({
	createUsageLogWithRetry: createUsageLogWithRetryMock,
	deleteUsageLogsByUserId: deleteUsageLogsByUserIdMock,
	listUsageLogs: listUsageLogsMock,
}));

vi.mock("../services/complianceService.js", () => ({
	evaluateSubmissionCompliance: evaluateSubmissionComplianceMock,
	evaluateUsageLogCompliance: evaluateUsageLogComplianceMock,
}));

import {
	checkComplianceForDraft,
	checkSubmissionCompliance,
	createLog,
	deleteLogsByUser,
	getLogs,
} from "../controllers/logController.js";

function makeRes() {
	const json = vi.fn();
	const status = vi.fn().mockReturnValue({ json });
	return { status, json };
}

describe("logController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		validateUsageLogPayloadMock.mockReturnValue({ valid: true });
	});

	describe("createLog", () => {
		it("returns 401 error when user is missing", async () => {
			const req = { headers: {}, body: {}, query: {} };
			const res = makeRes();
			const next = vi.fn();

			await createLog(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(AppError);
			expect(error.statusCode).toBe(401);
		});

		it("returns validation errors from payload", async () => {
			validateUsageLogPayloadMock.mockReturnValue({
				valid: false,
				message: "Missing required fields: toolName",
			});
			const req = {
				headers: { "x-user-id": "u1" },
				body: {},
				query: {},
			};
			const res = makeRes();
			const next = vi.fn();

			await createLog(req, res, next);

			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(AppError);
			expect(error.statusCode).toBe(400);
			expect(error.message).toContain("Missing required fields");
		});

		it("creates log using nested payload and returns compliance", async () => {
			const savedLog = {
				toObject: vi
					.fn()
					.mockReturnValue({ id: "1", toolName: "ChatGPT" }),
			};
			createUsageLogWithRetryMock.mockResolvedValue(savedLog);
			evaluateUsageLogComplianceMock.mockResolvedValue({ status: "ok" });
			const req = {
				headers: {},
				body: {
					payload: {
						userId: "u-body",
						courseId: "c1",
						assignmentId: "a1",
						toolName: "ChatGPT",
						assistanceType: "editing",
						contributionDescription: "Grammar",
					},
				},
				query: {},
			};
			const res = makeRes();
			const next = vi.fn();

			await createLog(req, res, next);

			expect(createUsageLogWithRetryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: "u-body",
					source: "manual",
				}),
			);
			expect(evaluateUsageLogComplianceMock).toHaveBeenCalledWith({
				id: "1",
				toolName: "ChatGPT",
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(next).not.toHaveBeenCalled();
		});

		it("forwards service errors to next", async () => {
			createUsageLogWithRetryMock.mockRejectedValue(new Error("db down"));
			const req = {
				headers: { "x-user-id": "u1" },
				body: {
					courseId: "c1",
					assignmentId: "a1",
					toolName: "ChatGPT",
					assistanceType: "editing",
					contributionDescription: "Grammar",
				},
				query: {},
			};
			const res = makeRes();
			const next = vi.fn();

			await createLog(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe("getLogs", () => {
		it("passes filters and returns logs", async () => {
			listUsageLogsMock.mockResolvedValue([{ id: "1" }]);
			const req = {
				query: {
					userId: "u1",
					courseId: "c1",
					assignmentId: "a1",
					limit: "10",
				},
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await getLogs(req, res, next);

			expect(listUsageLogsMock).toHaveBeenCalledWith(req.query);
			expect(res.json).toHaveBeenCalledWith({ data: [{ id: "1" }] });
			expect(next).not.toHaveBeenCalled();
		});

		it("forwards list errors", async () => {
			listUsageLogsMock.mockRejectedValue(new Error("db error"));
			const req = { query: {} };
			const res = { json: vi.fn() };
			const next = vi.fn();

			await getLogs(req, res, next);
			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe("deleteLogsByUser", () => {
		it("returns 400 when target userId is missing", async () => {
			const req = { headers: { "x-user-id": "u1" }, params: {} };
			const res = { json: vi.fn() };
			const next = vi.fn();

			await deleteLogsByUser(req, res, next);

			const error = next.mock.calls[0][0];
			expect(error.statusCode).toBe(400);
		});

		it("returns 403 when requesting user deletes another user", async () => {
			const req = {
				headers: { "x-user-id": "u1" },
				params: { userId: "u2" },
				body: {},
				query: {},
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await deleteLogsByUser(req, res, next);

			const error = next.mock.calls[0][0];
			expect(error.statusCode).toBe(403);
		});

		it("deletes and returns deletion summary", async () => {
			deleteUsageLogsByUserIdMock.mockResolvedValue({ deletedCount: 4 });
			const req = {
				headers: {},
				body: { userId: "u1" },
				query: {},
				params: { userId: "u1" },
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await deleteLogsByUser(req, res, next);

			expect(deleteUsageLogsByUserIdMock).toHaveBeenCalledWith("u1");
			expect(res.json).toHaveBeenCalledWith({
				message: "Usage logs deleted",
				deletedCount: 4,
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("checkComplianceForDraft", () => {
		it("returns compliance result for valid usage payload", async () => {
			evaluateUsageLogComplianceMock.mockResolvedValue({
				status: "warning",
			});
			const req = {
				body: {
					payload: {
						courseId: "c1",
						assignmentId: "a1",
						toolName: "ChatGPT",
						assistanceType: "editing",
						contributionDescription: "Grammar",
					},
				},
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkComplianceForDraft(req, res, next);

			expect(evaluateUsageLogComplianceMock).toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith({ status: "warning" });
		});

		it("forwards validation errors", async () => {
			validateUsageLogPayloadMock.mockReturnValue({
				valid: false,
				message: "Missing required fields: courseId",
			});
			const req = { body: {} };
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkComplianceForDraft(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(AppError));
		});
	});

	describe("checkSubmissionCompliance", () => {
		it("returns 400 when required fields are missing", async () => {
			const req = { body: { courseId: "c1", logs: [] } };
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkSubmissionCompliance(req, res, next);
			const error = next.mock.calls[0][0];
			expect(error.statusCode).toBe(400);
		});

		it("returns 400 when a log item is not an object", async () => {
			const req = {
				body: { courseId: "c1", assignmentId: "a1", logs: [null] },
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkSubmissionCompliance(req, res, next);
			const error = next.mock.calls[0][0];
			expect(error.message).toContain("logs[0] must be an object");
		});

		it("returns 400 when a log payload is invalid", async () => {
			validateUsageLogPayloadMock.mockReturnValueOnce({
				valid: false,
				message: "Missing required fields: toolName",
			});
			const req = {
				body: {
					courseId: "c1",
					assignmentId: "a1",
					logs: [{}],
				},
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkSubmissionCompliance(req, res, next);
			const error = next.mock.calls[0][0];
			expect(error.message).toContain("logs[0] invalid");
		});

		it("returns compliance result for valid submission", async () => {
			evaluateSubmissionComplianceMock.mockResolvedValue({
				status: "ok",
				results: [],
			});
			const req = {
				body: {
					courseId: "c1",
					assignmentId: "a1",
					logs: [
						{
							courseId: "c1",
							assignmentId: "a1",
							toolName: "ChatGPT",
							assistanceType: "editing",
							contributionDescription: "Grammar",
						},
					],
				},
			};
			const res = { json: vi.fn() };
			const next = vi.fn();

			await checkSubmissionCompliance(req, res, next);

			expect(evaluateSubmissionComplianceMock).toHaveBeenCalledWith({
				courseId: "c1",
				assignmentId: "a1",
				logs: req.body.logs,
			});
			expect(res.json).toHaveBeenCalledWith({
				status: "ok",
				results: [],
			});
			expect(next).not.toHaveBeenCalled();
		});
	});
});
