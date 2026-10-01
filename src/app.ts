import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env";
import uploadRouter from "./routes/upload.route";
import dbRouter from "./routes/db.route";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import apartmentRouter from "./routes/apartment.routes";
import notificationRouter from "./routes/notification.route";
import queueRouter from "./routes/queue.route";
import pollRouter from "./routes/poll.routes";
import optionRouter from "./routes/option.routes";
import commentRouter from "./routes/comment.route";
import complaintRouter from "./routes/complaint.route";
import noticeRouter from "./routes/notice.route";
import eventRouter from "./routes/event.route";
import { setupSwagger } from "./docs/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import residentRoute from "./routes/residents.route";

import incidentRouter from "./routes/incident.route";

const env = getEnv();
const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

setupSwagger(app);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    service: "welive-api",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ping", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "pong",
    success: true,
  });
});

app.use("/api", uploadRouter);
app.use("/api", dbRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/residents", residentRoute);
app.use("/api/apartments", apartmentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/queue", queueRouter);
app.use("/api/polls", pollRouter);
app.use("/api/options", optionRouter);
app.use("/api/comments", commentRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/notices", noticeRouter);
app.use("/api/event", eventRouter);

app.get("/api/poll-scheduler/ping", (_req, res) => {
  res.status(200).json({ message: "Poll scheduler is running." });
});

app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

export default app;
