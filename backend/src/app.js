import cors from "cors";
import express from "express";
import logRoutes from "./routes/logRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import { autoLoggingMiddleware } from "./middleware/autoLoggingMiddleware.js";
import { errorHandler } from "./utils/errorHandler.js";

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json({ limit: "1mb" }));
	app.use(autoLoggingMiddleware);

	app.get("/health", (req, res) => {
		res.json({ status: "ok" });
	});

	app.use("/api/logs", logRoutes);
	app.use("/api/policies", policyRoutes);

	app.use(errorHandler);

	return app;
}
