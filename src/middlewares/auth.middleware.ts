import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/access-token.js";
import UnauthorizedError from "../common/errors/unauthorized.error.js";
import { AuthRepository } from "../modules/auth/auth.repository.js";

const authRepository = new AuthRepository()

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

export const requireActiveSession: RequestHandler = async (req, _res, next) => {
    if (!req.auth) {
        throw new UnauthorizedError(
            "Authentication is required.",
        );
    }

    const session = await authRepository.findActiveSession(
        req.auth.userId,
        req.auth.sessionId,
    );

    if (!session) {
        throw new UnauthorizedError(
            "Session expired or revoked. Please log in again.",
        );
    }

    next();
};