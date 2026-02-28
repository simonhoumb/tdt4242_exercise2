import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
			trim: true,
			maxlength: 128,
			index: true,
		},
		courseId: {
			type: String,
			required: true,
			trim: true,
			maxlength: 64,
			index: true,
		},
		assignmentId: {
			type: String,
			required: true,
			trim: true,
			maxlength: 64,
			index: true,
		},
		toolName: {
			type: String,
			required: true,
			trim: true,
			maxlength: 128,
		},
		assistanceType: {
			type: String,
			required: true,
			enum: [
				"brainstorming",
				"editing",
				"translation",
				"code-review",
				"research",
				"summarization",
				"generation",
				"other",
			],
		},
		contributionDescription: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		aiContributionPercent: {
			type: Number,
			min: 0,
			max: 100,
			default: 0,
		},
		promptExcerpt: {
			type: String,
			trim: true,
			maxlength: 400,
		},
		responseExcerpt: {
			type: String,
			trim: true,
			maxlength: 400,
		},
		source: {
			type: String,
			enum: ["manual", "auto"],
			default: "manual",
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

usageLogSchema.index({ userId: 1, createdAt: -1 });
usageLogSchema.index({ courseId: 1, assignmentId: 1, createdAt: -1 });

export const UsageLog = mongoose.model("UsageLog", usageLogSchema);
