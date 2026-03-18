import { describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "../utils/errorHandler.js";

describe("AppError", () => {
	it("stores message, statusCode and details", () => {
		const err = new AppError("Bad request", 400, { field: "toolName" });
		expect(err.message).toBe("Bad request");
		expect(err.statusCode).toBe(400);
		expect(err.details).toEqual({ field: "toolName" });
	});
});

describe("errorHandler", () => {
	it("returns status and error message with details and stack outside production", () => {
		process.env.NODE_ENV = "test";
		const err = new AppError("Validation failed", 422, { key: "value" });
		err.stack = "stacktrace";
		const json = vi.fn();
		const res = {
			status: vi.fn().mockReturnValue({ json }),
		};

		errorHandler(err, {}, res, vi.fn());

		expect(res.status).toHaveBeenCalledWith(422);
		expect(json).toHaveBeenCalledWith({
			error: {
				message: "Validation failed",
				details: { key: "value" },
				stack: "stacktrace",
			},
		});
	});

	it("hides stack in production and falls back to 500", () => {
		process.env.NODE_ENV = "production";
		const err = new Error("");
		const json = vi.fn();
		const res = {
			status: vi.fn().mockReturnValue({ json }),
		};

		errorHandler(err, {}, res, vi.fn());

		expect(res.status).toHaveBeenCalledWith(500);
		expect(json).toHaveBeenCalledWith({
			error: {
				message: "Internal server error",
			},
		});
	});
});
