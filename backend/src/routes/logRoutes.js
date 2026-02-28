import { Router } from "express";
import {
	checkComplianceForDraft,
	checkSubmissionCompliance,
	createLog,
	deleteLogsByUser,
	getLogs,
} from "../controllers/logController.js";

const router = Router();

router.post("/", createLog);
router.get("/", getLogs);
router.delete("/user/:userId", deleteLogsByUser);
router.post("/compliance/check", checkComplianceForDraft);
router.post("/compliance/batch", checkSubmissionCompliance);

export default router;
