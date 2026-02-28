const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function toUserMessage(error) {
	if (error?.name === "AbortError") {
		return "Request cancelled";
	}

	if (error?.response?.error?.message) {
		return error.response.error.message;
	}

	if (error?.message) {
		return error.message;
	}

	return "Unexpected network error";
}

async function wait(milliseconds) {
	await new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

async function request(path, options = {}, maxAttempts = 3) {
	let attemptNumber = 0;
	let lastError;

	while (attemptNumber < maxAttempts) {
		try {
			attemptNumber += 1;
			const requestOptions = {
				...options,
				headers: {
					"Content-Type": "application/json",
					...(options.headers || {}),
				},
			};

			const response = await fetch(`${BASE_URL}${path}`, {
				...requestOptions,
			});

			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				const apiError = new Error(
					payload?.error?.message || "Request failed",
				);
				apiError.response = payload;
				apiError.status = response.status;
				throw apiError;
			}

			return payload;
		} catch (error) {
			lastError = error;
			if (attemptNumber >= maxAttempts) {
				break;
			}

			const retryable = !error.status || error.status >= 500;
			if (!retryable) {
				break;
			}

			await wait(200 * 2 ** (attemptNumber - 1));
		}
	}

	const transformedError = new Error(toUserMessage(lastError));
	transformedError.original = lastError;
	throw transformedError;
}

function normalizeUsagePayload(input) {
	if (!input || typeof input !== "object") {
		return {};
	}

	if (input.payload && typeof input.payload === "object") {
		return input.payload;
	}

	return input;
}

export async function createUsageLog({ userId, payload }) {
	const normalizedPayload = normalizeUsagePayload(payload);

	return request("/logs", {
		method: "POST",
		headers: {
			"x-user-id": userId,
		},
		body: JSON.stringify(normalizedPayload),
	});
}

export async function listUsageLogs({ userId, courseId, assignmentId }) {
	const params = new URLSearchParams();
	if (userId) {
		params.set("userId", userId);
	}
	if (courseId) {
		params.set("courseId", courseId);
	}
	if (assignmentId) {
		params.set("assignmentId", assignmentId);
	}

	return request(`/logs?${params.toString()}`, { method: "GET" });
}

export async function checkComplianceDraft(payload) {
	const normalizedPayload = normalizeUsagePayload(payload);

	return request("/logs/compliance/check", {
		method: "POST",
		body: JSON.stringify(normalizedPayload),
	});
}

export async function deleteUserLogs({ userId }) {
	return request(`/logs/user/${encodeURIComponent(userId)}`, {
		method: "DELETE",
		headers: {
			"x-user-id": userId,
		},
	});
}
