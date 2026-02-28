import { createUsageLogWithRetry } from "../services/loggingService.js";

function resolveAutoLogPayload(req, res) {
	if (res.locals?.autoLogPayload) {
		return res.locals.autoLogPayload;
	}

	if (req.body?.autoLogPayload) {
		return req.body.autoLogPayload;
	}

	return null;
}

function normalizeAutoPayload(payload, req) {
	const userId = payload.userId || req.headers["x-user-id"];
	if (!userId) {
		return null;
	}

	return {
		userId,
		courseId: payload.courseId,
		assignmentId: payload.assignmentId,
		toolName: payload.toolName,
		assistanceType: payload.assistanceType || "other",
		contributionDescription:
			payload.contributionDescription || "Auto-captured AI interaction",
		aiContributionPercent: Number(payload.aiContributionPercent ?? 0),
		promptExcerpt: payload.promptExcerpt,
		responseExcerpt: payload.responseExcerpt,
		source: "auto",
		metadata: payload.metadata || {},
	};
}

export function autoLoggingMiddleware(req, res, next) {
	res.on("finish", () => {
		setImmediate(async () => {
			try {
				const rawPayload = resolveAutoLogPayload(req, res);
				if (!rawPayload) {
					return;
				}

				const normalizedPayload = normalizeAutoPayload(rawPayload, req);
				if (!normalizedPayload) {
					return;
				}

				await createUsageLogWithRetry(normalizedPayload, 2);
			} catch (error) {
				console.error(
					"[autoLoggingMiddleware] Failed to persist usage log:",
					error.message,
				);
			}
		});
	});

	next();
}
