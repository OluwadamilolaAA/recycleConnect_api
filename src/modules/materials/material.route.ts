import { Router } from "express";

import {
    authenticate,
    requireActiveSession,
} from "../../middlewares/auth.middleware.js";

import { authorizeRoles } from "../../middlewares/authorize.middleware.js";

import { MaterialController } from "./material.controller.js";

const router = Router();
const controller = new MaterialController();

router.post("/", authenticate, requireActiveSession, authorizeRoles("ADMIN"), controller.create);

router.get("/", authenticate, requireActiveSession, controller.listActive);

export default router;