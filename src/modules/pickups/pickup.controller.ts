import type { Request, Response } from "express";
import { PickupService } from "./pickup.service.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { availablePickupsSchema, createPickupSchema, listAssignedPickupsSchema, listPickupsSchema, pickupParamsSchema } from "./pickup.schema.js";

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

    listMine = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const { page, limit } = listPickupsSchema.parse(req.query)
        const result = await this.pickupService.getMyPickups(
            req.auth.userId,
            page,
            limit
        )

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: result,
        });
    }

    getMine = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const { pickupId } = pickupParamsSchema.parse(req.params)
        const pickup = await this.pickupService.getMyPickup(req.auth.userId, pickupId)

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                pickup
            }
        })
    }

    cancelMine = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { pickupId } = pickupParamsSchema.parse(
            req.params,
        );

        const result = await this.pickupService.cancelMyPickup(
            pickupId,
            req.auth.userId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: result.message,
        });
    };

    listAvailable = async (req: Request, res: Response) => {
        const data = availablePickupsSchema.parse(req.query);

        const result = await this.pickupService.getAvailablePickups(
            data,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: result,
        });
    };

    claim = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { pickupId } = pickupParamsSchema.parse(req.params);

        const pickup = await this.pickupService.claimPickup(
            pickupId,
            req.auth.userId,
            req.auth.sessionId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Pickup claimed successfully.",
            data: {
                pickup,
            },
        });
    };

    listAssigned = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required." );
        }

        const query = listAssignedPickupsSchema.parse(
            req.query,
        );

        const result = await this.pickupService.getMyAssignedPickups(
            req.auth.userId,
            query,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: result,
        });
    };

    getAssigned = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { pickupId } = pickupParamsSchema.parse(
            req.params,
        );

        const pickup = await this.pickupService.getMyAssignedPickup(
            pickupId,
            req.auth.userId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                pickup,
            },
        });
    };
}