import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/index.js";

type UserRole =
    | "HOUSEHOLD"
    | "COLLECTOR"
    | "RECYCLER"
    | "ADMIN";

export function authorizeRoles(
    ...allowedRoles: UserRole[]): RequestHandler {
    return async (req, _res, next) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.auth.userId,
            },
            select: {
                role: true,
                status: true,
                emailVerifiedAt: true,
            },
        });

        if (
            !user ||
            user.status !== "ACTIVE" ||
            !user.emailVerifiedAt
        ) {
            throw new UnauthorizedError(
                "Authentication is required.",
            );
        }

        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError(
                "You do not have permission to perform this action.",
            );
        }

        next();
    };
}