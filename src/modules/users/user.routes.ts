import { Router } from "express";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";
import { UserController } from "./user.controller.js";
import { requireTrustedOrigin } from "../../middlewares/origin.middleware.js";
import { changePasswordIpLimiter, changePasswordUserLimiter } from "../../middlewares/ratelimit.middleware.js";

const router = Router()
const controller = new UserController()

router.get("/me", authenticate, controller.me);
router.patch("/me", authenticate, requireActiveSession, controller.updateProfile);
router.post(
  "/me/change-password",
  requireTrustedOrigin,
  changePasswordIpLimiter,
  authenticate,
  changePasswordUserLimiter,
  requireActiveSession,
  controller.changePassword,
);


export default router;