import express from "express";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ResidentsController } from "../controllers/residents.controller";
import { validateData } from "../middlewares/validation.middleware";
import { CreateResidentStruct, GetResidentsStruct, UpdateResidentStruct } from "../structs/resident.struct";
import { authorizeRole } from "../middlewares/auth.middleware";
import { UserIdParamStruct } from "../structs/user.struct";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { ResidentIdStruct } from "../structs/auth.struct";

const residentRoute = express.Router();

// 토큰 및 유저권한 확인
residentRoute.use(authMiddleware, tenantMiddleware, authorizeRole(["ADMIN"]));

const residentsController = new ResidentsController();

residentRoute.get("/", validateData(GetResidentsStruct, "query"), residentsController.getResidents);
residentRoute.post("/", validateData(CreateResidentStruct, "body"), residentsController.createResident);
residentRoute.post(
  "/from-users/:userId",
  validateData(UserIdParamStruct, "params"),
  residentsController.createResidentFromUser,
);
residentRoute.get("/file/template", residentsController.downloadResidentTemplate);
residentRoute.post("/from-file", uploadMiddleware.single("file"), residentsController.createResidentsFromFile);
residentRoute.get("/file", validateData(GetResidentsStruct, "query"), residentsController.downloadResidentList);
residentRoute.get("/:residentId", validateData(ResidentIdStruct, "params"), residentsController.getResidentById);
residentRoute.patch(
  "/:residentId",
  validateData(ResidentIdStruct, "params"),
  validateData(UpdateResidentStruct, "body"),
  residentsController.updateResident,
);
residentRoute.delete("/:residentId", validateData(ResidentIdStruct, "params"), residentsController.deleteResident);

export default residentRoute;
