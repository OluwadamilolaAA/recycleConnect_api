import type { Request, Response } from "express";
import { loginSchema, registerSchema, verifyEmailSchema } from "./auth.schema.js";
import { AuthService } from "./auth.service.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../../config/cookies.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";

export class AuthController {
    constructor(
        private readonly authService = new AuthService()
    ) { }

    register = async (req: Request, res: Response) => {
        const data = registerSchema.parse(req.body)

        const result = await this.authService.register(data)

        res.status(200).json({
            success: true,
            ...result
        })
    }

    verifyEmail = async (req: Request, res: Response) => {
        const data = verifyEmailSchema.parse(req.body)

        const result = await this.authService.verifyEmail(data.token)

        res.status(200).json({
            success: true,
            ...result
        })
    }

    login = async (req: Request, res: Response) => {
        const data = loginSchema.parse(req.body)
        const userAgent = req.get("user-agent") ?? null;

        const result = await this.authService.login(data, userAgent)

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
            ...refreshCookieOptions,
            expires: result.refreshTokenExpiresAt
        });

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Login successfully",
            data: {
                user: result.user,
                accessToken: result.accessToken,
                tokenType: result.tokenType,
                expiresIn: result.expiresIn
            }
        })
    }

    me = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError(
                "Authentication is required.",
            );
        }

        const user = await this.authService.getCurrentUser(
            req.auth.userId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    };

    refresh = async (req: Request, res: Response) => {
        res.set("Cache-Control", "no-store");

        const refreshToken: unknown =
            req.cookies?.[REFRESH_COOKIE_NAME];

        if (
            typeof refreshToken !== "string" ||
            !/^[A-Za-z0-9_-]{43}$/.test(refreshToken)
        ) {
            res.clearCookie(
                REFRESH_COOKIE_NAME,
                refreshCookieOptions,
            );

            throw new UnauthorizedError(
                "A valid refresh-token cookie is required.",
            );
        }

        try {
            const result = await this.authService.refresh(
                refreshToken,
            );

            res.cookie(
                REFRESH_COOKIE_NAME,
                result.refreshToken,
                {
                    ...refreshCookieOptions,
                    expires: result.refreshTokenExpiresAt,
                },
            );

            res.status(200).json({
                success: true,

                data: {
                    accessToken: result.accessToken,
                    tokenType: result.tokenType,
                    expiresIn: result.expiresIn,
                },
            });
        } catch (error: unknown) {
            if (error instanceof UnauthorizedError) {
                res.clearCookie(
                    REFRESH_COOKIE_NAME,
                    refreshCookieOptions,
                );
            }

            throw error;
        }
    };
}