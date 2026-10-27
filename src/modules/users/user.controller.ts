import type { Request, Response } from "express";

import { UnauthorizedError } from "../../common/errors/index.js";
import { UserService } from "./user.service.js";

export class UserController {
    constructor(
        private readonly userService = new UserService()
    ) {}

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
}