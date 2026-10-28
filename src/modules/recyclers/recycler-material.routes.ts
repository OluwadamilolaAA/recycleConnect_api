import { Router } from "express";
import {authenticate, requireActiveSession} from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { RecyclerMaterialController } from "./recycler-material.controller.js";

const router = Router();
const controller = new RecyclerMaterialController();
router.use(authenticate, requireActiveSession, authorizeRoles("RECYCLER"));

router.post("/me/materials", controller.add);

router.get("/me/materials", controller.list);

router.delete("/me/materials/:materialId", controller.remove);

export default router;