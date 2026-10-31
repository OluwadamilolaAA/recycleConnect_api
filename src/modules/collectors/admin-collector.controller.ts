import type { Request, Response } from "express";
import { UnauthorizedError } from "../../common/errors/index.js";
import { CollectorAdminService } from "./collector-admin.service.js";
import { collectorApplicationParamsSchema, listCollectorApplicationsSchema, reviewCollectorApplicationSchema } from "./collector-admin.schema.js";

export class CollectorAdminController {
    constructor(
        private readonly service = new CollectorAdminService()

    ) {}

    list = async (req: Request, res: Response) => {
        const { status, page, limit } = listCollectorApplicationsSchema.parse(req.query);

        const result = await this.service.listApplications(
            status,
            page,
            limit,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: result,
        });
    };

    review = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { collectorId } = collectorApplicationParamsSchema.parse(req.params);

        const data = reviewCollectorApplicationSchema.parse(req.body);

        const result = await this.service.reviewApplication(
            collectorId,
            req.auth.userId,
            data,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                approvalStatus: result.approvalStatus,
            },
        });
    };
}