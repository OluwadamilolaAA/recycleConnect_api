import { Router } from "express";
import {authenticate, requireActiveSession} from "../../middlewares/auth.middleware.js";
import { AddressController } from "./address.controller.js";

const router = Router();
const controller = new AddressController();

router.post("/", authenticate, requireActiveSession, controller.create);

router.get("/", authenticate, requireActiveSession, controller.list);

export default router;