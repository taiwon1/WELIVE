import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { UserController } from "../controllers/user.controller";
import { validateData } from "../middlewares/validation.middleware";
import { PasswordStruct, UpdateProfileSchema } from "../structs/user.struct";
import { uploadMiddleware } from "../middlewares/upload.middleware";

const userRouter = express.Router();
const userController = new UserController();

userRouter.use(authMiddleware);

userRouter.get("/me", userController.getMe);

userRouter.patch(
  "/me",
  uploadMiddleware.single("file"),
  validateData(UpdateProfileSchema, "body"),
  userController.updateProfile,
);
userRouter.patch("/password", validateData(PasswordStruct, "body"), userController.changePassword);

export default userRouter;
