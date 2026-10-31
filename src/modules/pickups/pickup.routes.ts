import { Router } from "express";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { PickupController } from "./pickup.controller.js";
import { requireApprovedCollector } from "../../middlewares/collector.middleware.js";

const router = Router();
const controller = new PickupController();

router.post(
    "/",
    authenticate,
    requireActiveSession,
    authorizeRoles("HOUSEHOLD"),
    controller.create,
);

router.get(
    "/",
    authenticate,
    requireActiveSession,
    authorizeRoles("HOUSEHOLD"),
    controller.listMine,
);

router.get(
  "/available",
  authenticate,
  requireActiveSession,
  authorizeRoles("COLLECTOR"),
  requireApprovedCollector,
  controller.listAvailable,
);

router.get(
    "/:pickupId",
    authenticate,
    requireActiveSession,
    authorizeRoles("HOUSEHOLD"),
    controller.getMine,
);

router.post(
    "/:pickupId/cancel",
    authenticate,
    requireActiveSession,
    authorizeRoles("HOUSEHOLD"),
    controller.cancelMine,
);

export default router;