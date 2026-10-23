import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { registerLimiter, verifyEmailLimiter } from "../../middlewares/ratelimit.middleware.js";

const router = Router()
const controller = new AuthController()

router.post("/register", registerLimiter, controller.register);
router.post("/verify-email", verifyEmailLimiter, controller.verifyEmail)

export default router;