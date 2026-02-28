import { Router } from "express";
import {
	createPolicyRule,
	listPolicyRulesHandler,
} from "../controllers/policyController.js";

const router = Router();

router.post("/", createPolicyRule);
router.get("/", listPolicyRulesHandler);

export default router;
