import mongoose from "mongoose";

const policyRuleSchema = new mongoose.Schema(
	{
		ruleId: {
			type: String,
			required: true,
			trim: true,
			uppercase: true,
			maxlength: 128,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
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
			trim: true,
			maxlength: 64,
			default: null,
		},
		enabled: {
			type: Boolean,
			default: true,
		},
		severity: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		ruleType: {
			type: String,
			required: true,
			enum: [
				"assistance_type_not_allowed",
				"required_field_non_empty",
				"max_ai_contribution",
				"keyword_block",
			],
		},
		conditions: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		educationalMessage: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1200,
		},
		suggestedAction: {
			type: String,
			required: true,
			trim: true,
			maxlength: 500,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

policyRuleSchema.index({ courseId: 1, assignmentId: 1, enabled: 1 });
policyRuleSchema.index({ courseId: 1, ruleId: 1 }, { unique: true });

export const PolicyRule = mongoose.model("PolicyRule", policyRuleSchema);
