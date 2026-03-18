import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/errorHandler.js";

const { validatePolicyPayloadMock, policyRuleCreateMock, listPolicyRulesMock } =
	vi.hoisted(() => ({
		validatePolicyPayloadMock: vi.fn(),
		policyRuleCreateMock: vi.fn(),
		listPolicyRulesMock: vi.fn(),
	}));

vi.mock("../utils/validators.js", () => ({
	validatePolicyPayload: validatePolicyPayloadMock,
}));

vi.mock("../models/PolicyRule.js", () => ({
	PolicyRule: {
		create: policyRuleCreateMock,
	},
}));

vi.mock("../repositories/policyRuleRepository.js", () => ({
	listPolicyRules: listPolicyRulesMock,
}));

import {
	createPolicyRule,
	listPolicyRulesHandler,
} from "../controllers/policyController.js";

function makeRes() {
	const json = vi.fn();
	const status = vi.fn().mockReturnValue({ json });
	return { status, json };
}

describe("policyController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		validatePolicyPayloadMock.mockReturnValue({ valid: true });
	});

	it("createPolicyRule forwards validation errors", async () => {
		validatePolicyPayloadMock.mockReturnValue({
			valid: false,
			message: "Missing required fields: ruleId",
		});
		const req = { body: {} };
		const res = makeRes();
		const next = vi.fn();

		await createPolicyRule(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.any(AppError));
		expect(next.mock.calls[0][0].statusCode).toBe(400);
	});

	it("createPolicyRule creates and returns policy rule", async () => {
		policyRuleCreateMock.mockResolvedValue({ id: "r1" });
		const req = {
			body: {
				ruleId: "R1",
				name: "Rule",
				description: "Desc",
				courseId: "TDT4242",
				ruleType: "keyword_block",
				educationalMessage: "Learn",
				suggestedAction: "Fix",
			},
		};
		const res = makeRes();
		const next = vi.fn();

		await createPolicyRule(req, res, next);

		expect(policyRuleCreateMock).toHaveBeenCalledWith(req.body);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.status.mock.results[0].value.json).toHaveBeenCalledWith({
			data: { id: "r1" },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("listPolicyRulesHandler returns filtered rules", async () => {
		listPolicyRulesMock.mockResolvedValue([{ ruleId: "R1" }]);
		const req = { query: { courseId: "c1", assignmentId: "a1" } };
		const res = { json: vi.fn() };
		const next = vi.fn();

		await listPolicyRulesHandler(req, res, next);

		expect(listPolicyRulesMock).toHaveBeenCalledWith({
			courseId: "c1",
			assignmentId: "a1",
		});
		expect(res.json).toHaveBeenCalledWith({ data: [{ ruleId: "R1" }] });
		expect(next).not.toHaveBeenCalled();
	});

	it("listPolicyRulesHandler forwards repository errors", async () => {
		listPolicyRulesMock.mockRejectedValue(new Error("db down"));
		const req = { query: {} };
		const res = { json: vi.fn() };
		const next = vi.fn();

		await listPolicyRulesHandler(req, res, next);
		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});
});
