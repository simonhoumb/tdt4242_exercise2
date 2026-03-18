import { describe, expect, it, vi } from "vitest";

const { connectMock } = vi.hoisted(() => ({
	connectMock: vi.fn(),
}));

vi.mock("mongoose", () => ({
	default: {
		connect: connectMock,
	},
}));

import { connectDatabase } from "../config/db.js";

describe("connectDatabase", () => {
	it("throws when mongo uri is missing", async () => {
		await expect(connectDatabase("")).rejects.toThrow(
			"MONGODB_URI is required",
		);
	});

	it("connects with configured dbName", async () => {
		process.env.MONGODB_DB_NAME = "custom-db";
		connectMock.mockResolvedValue({});

		await connectDatabase("mongodb://localhost:27017");

		expect(connectMock).toHaveBeenCalledWith("mongodb://localhost:27017", {
			dbName: "custom-db",
		});
	});

	it("uses default dbName when env var is not set", async () => {
		delete process.env.MONGODB_DB_NAME;
		connectMock.mockResolvedValue({});

		await connectDatabase("mongodb://localhost:27017");

		expect(connectMock).toHaveBeenCalledWith("mongodb://localhost:27017", {
			dbName: "aiguidebook",
		});
	});
});
