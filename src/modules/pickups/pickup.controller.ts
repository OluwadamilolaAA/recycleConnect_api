import type { Request, Response } from "express";
import { PickupService } from "./pickup.service.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { createPickupSchema } from "./pickup.schema.js";

export class PickupController {
    constructor(
        private readonly pickupService = new PickupService()
    ) { }
    create = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const data = createPickupSchema.parse(req.body)
        const pickup = await this.pickupService.createPickup(req.auth.userId, data)

        res.set("Cache-Control", "no-store");

        res.status(201).json({
            success: true,
            message: "Pickup request created successfully.",
            data: {
                pickup,
            },
        });
    }
}