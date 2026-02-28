import { AppError } from "../utils/errorHandler.js";
import { PolicyRule } from "../models/PolicyRule.js";
import { validatePolicyPayload } from "../utils/validators.js";

export async function createPolicyRule(req, res, next) {
	try {
		const validation = validatePolicyPayload(req.body);
		if (!validation.valid) {
			throw new AppError(validation.message, 400);
		}

		const createdRule = await PolicyRule.create(req.body);
		res.status(201).json({ data: createdRule });
	} catch (error) {
		next(error);
	}
}

export async function listPolicyRulesHandler(req, res, next) {
	try {
		const query = {};

		if (req.query.courseId) {
			query.courseId = req.query.courseId;
		}

		if (req.query.assignmentId) {
			query.$or = [
				{ assignmentId: req.query.assignmentId },
				{ assignmentId: null },
			];
		}

		const rules = await PolicyRule.find(query)
			.sort({ createdAt: -1 })
			.lean();
		res.json({ data: rules });
	} catch (error) {
		next(error);
	}
}
