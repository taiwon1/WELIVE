import { Router } from "express";
import * as pollController from "../controllers/poll.controller";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", pollController.getPolls);
router.get("/:pollId", pollController.getPollById);

router.post("/", adminMiddleware, pollController.createPoll);
router.patch("/:pollId", adminMiddleware, pollController.updatePoll);
router.delete("/:pollId", adminMiddleware, pollController.deletePoll);

export default router;
