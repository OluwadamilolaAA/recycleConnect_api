import { Router } from "express";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { PickupController } from "./pickup.controller.js";

const router = Router();
const controller = new PickupController();

router.post(
    "/",
    authenticate,
    requireActiveSession,
    authorizeRoles("HOUSEHOLD"),
    controller.create,
);

export default router;