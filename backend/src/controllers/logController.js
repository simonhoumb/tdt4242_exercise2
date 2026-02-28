import { AppError } from "../utils/errorHandler.js";
import { validateUsageLogPayload } from "../utils/validators.js";
import {
	createUsageLogWithRetry,
	deleteUsageLogsByUserId,
	listUsageLogs,
} from "../services/loggingService.js";
import {
	evaluateSubmissionCompliance,
	evaluateUsageLogCompliance,
} from "../services/complianceService.js";

function resolveUserId(req) {
	const body = req.body || {};
	const nestedPayload =
		body && typeof body.payload === "object" && body.payload !== null
			? body.payload
			: null;

	return (
		req.headers["x-user-id"] ||
		body.userId ||
		nestedPayload?.userId ||
		req.query.userId
	);
}

function resolveUsagePayload(body) {
	if (body && typeof body.payload === "object" && body.payload !== null) {
		return body.payload;
	}

	return body || {};
}

export async function createLog(req, res, next) {
	try {
		const userId = resolveUserId(req);
		const usagePayload = resolveUsagePayload(req.body);
		if (!userId) {
			throw new AppError(
				"Unauthenticated request. Provide x-user-id.",
				401,
			);
		}

		const validation = validateUsageLogPayload(usagePayload);
		if (!validation.valid) {
			throw new AppError(validation.message, 400);
		}

		const payload = {
			...usagePayload,
			userId,
			source: "manual",
		};

		const savedLog = await createUsageLogWithRetry(payload);
		const compliance = await evaluateUsageLogCompliance(
			savedLog.toObject(),
		);

		res.status(201).json({
			data: savedLog,
			compliance,
		});
	} catch (error) {
		next(error);
	}
}

export async function getLogs(req, res, next) {
	try {
		const logs = await listUsageLogs({
			userId: req.query.userId,
			courseId: req.query.courseId,
			assignmentId: req.query.assignmentId,
			limit: req.query.limit,
		});

		res.json({ data: logs });
	} catch (error) {
		next(error);
	}
}

export async function deleteLogsByUser(req, res, next) {
	try {
		const requestingUserId = req.headers["x-user-id"];
		const targetUserId = req.params.userId;

		if (!targetUserId) {
			throw new AppError("userId is required", 400);
		}

		if (requestingUserId && requestingUserId !== targetUserId) {
			throw new AppError(
				"Forbidden. You can only delete your own logs.",
				403,
			);
		}

		const deletion = await deleteUsageLogsByUserId(targetUserId);

		res.json({
			message: "Usage logs deleted",
			...deletion,
		});
	} catch (error) {
		next(error);
	}
}

export async function checkComplianceForDraft(req, res, next) {
	try {
		const usagePayload = resolveUsagePayload(req.body);
		const validation = validateUsageLogPayload(usagePayload);
		if (!validation.valid) {
			throw new AppError(validation.message, 400);
		}

		const compliance = await evaluateUsageLogCompliance(usagePayload);
		res.json(compliance);
	} catch (error) {
		next(error);
	}
}

export async function checkSubmissionCompliance(req, res, next) {
	try {
		const { courseId, assignmentId, logs } = req.body;

		if (!courseId || !assignmentId || !Array.isArray(logs)) {
			throw new AppError(
				"courseId, assignmentId and logs[] are required",
				400,
			);
		}

		const compliance = await evaluateSubmissionCompliance({
			courseId,
			assignmentId,
			logs,
		});

		res.json(compliance);
	} catch (error) {
		next(error);
	}
}
