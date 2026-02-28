import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
	if (!mongoUri) {
		throw new Error("MONGODB_URI is required");
	}

	await mongoose.connect(mongoUri, {
		dbName: process.env.MONGODB_DB_NAME || "aiguidebook",
	});
}
