import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router()
const controller = new AuthController()

router.post("/register", controller.register);
router.post("/verify-email", controller.verifyEmail)

export default router;