import type { ErrorRequestHandler } from "express";

import { ZodError } from "zod";

import { CustomAPIError } from "../common/errors/index.js";
import { Prisma } from "../generated/prisma/client.js";

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });

        return;
    }

    if (error instanceof CustomAPIError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });

        return;
    }

    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        res.status(409).json({
            success: false,
            message: "A record with this value already exists",
        });

        return;
    }

    if (
        error instanceof SyntaxError &&
        "type" in error &&
        error.type === "entity.parse.failed"
    ) {
        res.status(400).json({
            success: false,
            message: "Request body contains invalid JSON",
        });

        return;
    }

    if (
        error instanceof Error &&
        "type" in error &&
        error.type === "entity.too.large"
    ) {
        res.status(413).json({
            success: false,
            message: "Request body is too large",
        });

        return;
    }

    console.error("Unexpected request error:", {
        name: error instanceof Error ? error.name : "UnknownError",

        prismaCode:
            error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
    });

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};