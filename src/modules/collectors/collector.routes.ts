import { Router } from "express";

import {
    authenticate,
    requireActiveSession,
} from "../../middlewares/auth.middleware.js";

import { authorizeRoles } from "../../middlewares/authorize.middleware.js";

import { CollectorController } from "./collector.controller.js";

const router = Router();
const controller = new CollectorController();

router.use(
    authenticate,
    requireActiveSession,
    authorizeRoles("COLLECTOR"),
);

router.post(
    "/me/application",
    controller.submitApplication,
);

router.get(
    "/me/application",
    controller.getMyApplication,
);

export default router;