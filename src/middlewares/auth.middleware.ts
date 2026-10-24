import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/access-token.js";
import UnauthorizedError from "../common/errors/unauthorized.error.js";

export const authenticate: RequestHandler = (req, _res, next) => {
    const authorization = req.get("authorization");

    const match = authorization?.match(
        /^Bearer ([^\s]+)$/i,
    );

    if (!match) {
        throw new UnauthorizedError(
            "A Bearer access token is required.",
        );
    }

    let auth: {
        userId: string;
        sessionId: string;
    };

    try {
        auth = verifyAccessToken(match[1]!);
    } catch {
        throw new UnauthorizedError(
            "Invalid or expired access token.",
        );
    }

    req.auth = auth;

    next();
};