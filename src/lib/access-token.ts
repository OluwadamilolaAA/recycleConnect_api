import jwt from "jsonwebtoken";
import { z } from "zod";
import { AUTH_CONFIG } from "../config/auth.js";
import { env } from "../config/env.js";

const signingKey = Buffer.from(env.JWT_SECRET, "hex");

const accessTokenClaimsSchema = z.object({
    sub: z.string().uuid(),
    sid: z.string().uuid(),
    tokenUse: z.literal("access"),
    iat: z.number().int(),
    exp: z.number().int(),
});

type AccessTokenInput = {
    userId: string;
    sessionId: string;
};

export function createAccessToken(data: AccessTokenInput): string {
    return jwt.sign(
        {
            sid: data.sessionId,
            tokenUse: "access",
        },
        signingKey,
        {
            algorithm: "HS256",

            header: {
                alg: "HS256",
                typ: "at+jwt",
            },

            subject: data.userId,

            issuer: env.JWT_ISSUER,

            audience: env.JWT_AUDIENCE,

            expiresIn: AUTH_CONFIG.accessTokenLifetimeSeconds,
        },
    );
}

export function verifyAccessToken(token: string) {
    const decoded = jwt.verify(token, signingKey, {
        algorithms: ["HS256"],

        issuer: env.JWT_ISSUER,

        audience: env.JWT_AUDIENCE,

        complete: true,
    });

    if (
        typeof decoded === "string" ||
        decoded.header.typ !== "at+jwt"
    ) {
        throw new Error("Invalid access token type");
    }

    const claims = accessTokenClaimsSchema.parse(
        decoded.payload,
    );

    return {
        userId: claims.sub,
        sessionId: claims.sid,
    };
}