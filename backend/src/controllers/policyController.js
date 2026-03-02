import { AppError } from "../utils/errorHandler.js";
import { PolicyRule } from "../models/PolicyRule.js";
import { validatePolicyPayload } from "../utils/validators.js";
import { listPolicyRules } from "../repositories/policyRuleRepository.js";

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
		const rules = await listPolicyRules({
			courseId: req.query.courseId,
			assignmentId: req.query.assignmentId,
		});
		res.json({ data: rules });
	} catch (error) {
		next(error);
	}
}
