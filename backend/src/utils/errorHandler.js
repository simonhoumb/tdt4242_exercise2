export class AppError extends Error {
	constructor(message, statusCode = 500, details = null) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
	}
}

export function errorHandler(err, _req, res, _next) {
	const statusCode = err.statusCode || 500;
	const response = {
		error: {
			message: err.message || "Internal server error",
		},
	};

	if (err.details) {
		response.error.details = err.details;
	}

	if (process.env.NODE_ENV !== "production" && err.stack) {
		response.error.stack = err.stack;
	}

	res.status(statusCode).json(response);
}
