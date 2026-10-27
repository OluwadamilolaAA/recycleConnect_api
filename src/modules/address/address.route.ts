import { Router } from "express";
import { authenticate, requireActiveSession } from "../../middlewares/auth.middleware.js";
import { AddressController } from "./address.controller.js";

const router = Router();
const controller = new AddressController();

router.post("/", authenticate, requireActiveSession, controller.create);

router.get("/", authenticate, requireActiveSession, controller.list);

router.get("/:addressId", authenticate, requireActiveSession, controller.getOne);

router.patch("/:addressId", authenticate, requireActiveSession, controller.update);

router.delete("/:addressId", authenticate, requireActiveSession, controller.remove);

export default router;