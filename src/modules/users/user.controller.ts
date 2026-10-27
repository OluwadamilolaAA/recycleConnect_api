import type { Request, Response } from "express";

import { UnauthorizedError } from "../../common/errors/index.js";
import { UserService } from "./user.service.js";
import { changePasswordSchema, updateProfileSchema } from "./user.schema.js";
import { success } from "zod";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../../config/cookies.js";

export class UserController {
    constructor(
        private readonly userService = new UserService()
    ) { }

    me = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const user = await this.userService.getCurrentUser(req.auth.userId);

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    };

    updateProfile = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const data = updateProfileSchema.parse(req.body)

        const user = await this.userService.updateProfile(req.auth.userId, data.name)

        res.set("Cache-Control", "no-store")

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user
            }
        })
    }

    changePassword = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const data = changePasswordSchema.parse(req.body);

        const result = await this.userService.changePassword(
            req.auth.userId,
            req.auth.sessionId,
            data.currentPassword,
            data.newPassword,
        );

        res.clearCookie(
            REFRESH_COOKIE_NAME,
            refreshCookieOptions,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: result.message,
        });
    };
}