import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/index.js";

export const requireApprovedCollector: RequestHandler =
    async (req, _res, next) => {
        if (!req.auth) {
            throw new UnauthorizedError(
                "Authentication is required.",
            );
        }

        const profile = await prisma.collectorProfile.findUnique({
            where: {
                userId: req.auth.userId,
            },
            select: {
                approvalStatus: true,
            },
        });

        if (!profile || profile.approvalStatus !== "APPROVED") {
            throw new ForbiddenError(
                "Collector approval is required.",
            );
        }

        next();
    };