import type { Request, Response } from "express";
import { CollectorService } from "./collector.service.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";

export class CollectorController {
    constructor(
        private readonly collectorService = new CollectorService()
    ) { }

    submitApplication = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const application = await this.collectorService.submitApplication(req.auth.userId)

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Your collector application is on file.",
            data: {
                application,
            },
        });
    }

    getMyApplication = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const application = await this.collectorService.getMyApplication(
                req.auth.userId,
            );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                application,
            },
        });
    }
}