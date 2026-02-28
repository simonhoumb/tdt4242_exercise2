import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
	path: path.resolve(__dirname, "../.env"),
});

const app = createApp();
const port = Number(process.env.PORT || 4000);

async function bootstrap() {
	try {
		await connectDatabase(process.env.MONGODB_URI);
		app.listen(port, () => {
			console.log(`Backend listening on http://localhost:${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
}

bootstrap();
