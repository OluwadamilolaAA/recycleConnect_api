import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { UserController } from "./user.controller.js";

const router = Router()
const controller = new UserController()
router.get("/me", authenticate, controller.me)


export default router;