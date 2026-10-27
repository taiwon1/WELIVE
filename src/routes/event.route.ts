import { Router } from "express";
import * as eventController from "../controllers/event.controller.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const eventRouter = Router();

// 이벤트 목록 조회 (관리자/입주민 모두)
eventRouter.use(authMiddleware, tenantMiddleware);
eventRouter.get("/", eventController.getEvents);

// 이벤트 생성 또는 업데이트 (관리자 전용)
eventRouter.put("/", adminMiddleware, eventController.upsertEvent);

// 이벤트 삭제 (관리자 전용)
eventRouter.delete("/:eventId", adminMiddleware, eventController.deleteEvent);

export default eventRouter;