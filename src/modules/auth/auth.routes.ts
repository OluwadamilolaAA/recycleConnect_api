import { Router } from "express";

import { requireTrustedOrigin } from "../../middlewares/origin.middleware.js";
import { AuthController } from "./auth.controller.js";
import { loginEmailLimiter, loginIpLimiter, logoutLimiter, passwordResetEmailLimiter, passwordResetIpLimiter, refreshLimiter, registerLimiter, resendVerificationEmailLimiter, resendVerificationIpLimiter, resetPasswordIpLimiter, sessionManagementLimiter, verifyEmailLimiter, verifyPasswordResetOtpEmailLimiter, verifyPasswordResetOtpIpLimiter } from "../../middlewares/ratelimit.middleware.js";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";

const router = Router();
const controller = new AuthController();

router.post("/register", registerLimiter, controller.register);
router.post("/verify-email", verifyEmailLimiter, controller.verifyEmail);
router.post("/login", requireTrustedOrigin, loginIpLimiter, loginEmailLimiter, controller.login,);
router.get("/me", authenticate, controller.me);
router.post("/refresh", requireTrustedOrigin, refreshLimiter, controller.refresh);
router.post("/logout", requireTrustedOrigin, logoutLimiter, controller.logout);
router.get("/sessions", sessionManagementLimiter, authenticate, requireActiveSession, controller.listSessions);
router.delete("/sessions/:sessionId", requireTrustedOrigin, sessionManagementLimiter, authenticate, requireActiveSession, controller.revokeSession);
router.post(
    "/forgot-password",
    passwordResetIpLimiter,
    passwordResetEmailLimiter,
    controller.requestPasswordReset,
);

router.post(
  "/verify-password-reset-otp",
  verifyPasswordResetOtpIpLimiter,
  verifyPasswordResetOtpEmailLimiter,
  controller.verifyPasswordResetOtp,
);

router.post(
  "/reset-password",
  resetPasswordIpLimiter,
  controller.resetPassword,
);

router.post(
  "/resend-verification-email",
  resendVerificationIpLimiter,
  resendVerificationEmailLimiter,
  controller.resendVerificationEmail,
);

export default router;