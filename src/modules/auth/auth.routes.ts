import { Router } from "express";

import { requireTrustedOrigin } from "../../middlewares/origin.middleware.js";
import { AuthController } from "./auth.controller.js";
import { loginEmailLimiter, loginIpLimiter, registerLimiter, verifyEmailLimiter } from "../../middlewares/ratelimit.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();
const controller = new AuthController();

router.post("/register", registerLimiter,controller.register);
router.post("/verify-email", verifyEmailLimiter,controller.verifyEmail);
router.post("/login", requireTrustedOrigin, loginIpLimiter, loginEmailLimiter, controller.login,);
router.get("/me", authenticate, controller.me);

export default router;