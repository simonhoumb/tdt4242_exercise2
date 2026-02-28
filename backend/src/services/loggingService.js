import { UsageLog } from "../models/UsageLog.js";

async function wait(milliseconds) {
	await new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

export async function createUsageLog(payload) {
	return UsageLog.create(payload);
}

export async function createUsageLogWithRetry(payload, maxAttempts = 3) {
	let attemptNumber = 0;
	let lastError;

	while (attemptNumber < maxAttempts) {
		try {
			attemptNumber += 1;
			return await createUsageLog(payload);
		} catch (error) {
			lastError = error;
			if (attemptNumber >= maxAttempts) {
				break;
			}
			const backoffMs = 150 * 2 ** (attemptNumber - 1);
			await wait(backoffMs);
		}
	}

	throw lastError;
}

export async function listUsageLogs({
	userId,
	courseId,
	assignmentId,
	limit = 50,
}) {
	const query = {};

	if (userId) {
		query.userId = userId;
	}

	if (courseId) {
		query.courseId = courseId;
	}

	if (assignmentId) {
		query.assignmentId = assignmentId;
	}

	const boundedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
	return UsageLog.find(query)
		.sort({ createdAt: -1 })
		.limit(boundedLimit)
		.lean();
}

export async function deleteUsageLogsByUserId(userId) {
	const deletionResult = await UsageLog.deleteMany({ userId });
	return {
		deletedCount: deletionResult.deletedCount || 0,
	};
}
