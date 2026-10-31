import { Router } from "express";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { CollectorAdminController } from "./admin-collector.controller.js";


const router = Router();
const controller = new CollectorAdminController();

router.use(
    authenticate,
    requireActiveSession,
    authorizeRoles("ADMIN"),
);

router.get("/", controller.list);

router.post("/:collectorId/review", controller.review);

export default router;