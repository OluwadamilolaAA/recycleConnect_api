import { createHash } from "node:crypto";
import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";
import { redis } from "../lib/redis.js";

type LimiterOptions = {
    prefix: string;
    windowMs: number;
    limit: number;
    message: string;
    keyGenerator?: (req: Request) => string;
};

function createLimiter(options: LimiterOptions) {
    return rateLimit({
        windowMs: options.windowMs,

        limit: options.limit,

        standardHeaders: "draft-8",

        legacyHeaders: false,

        passOnStoreError: false,

        ...(options.keyGenerator
            ? {
                keyGenerator: options.keyGenerator,
            }
            : {}),

        store: new RedisStore({
            prefix: options.prefix,

            sendCommand: (
                command: string,
                ...args: string[]
            ) => {
                return redis.call(
                    command,
                    ...args,
                ) as Promise<RedisReply>;
            },
        }),

        message: {
            success: false,
            message: options.message,
        },
    });
}

export const registerLimiter = createLimiter({
    prefix: "recycleconnect:rl:register:",

    windowMs: 60 * 60 * 1000,

    limit: 5,

    message:
        "Too many registration attempts. Please try again later.",
});

export const verifyEmailLimiter = createLimiter({
    prefix: "recycleconnect:rl:verify-email:",

    windowMs: 15 * 60 * 1000,

    limit: 30,

    message:
        "Too many verification attempts. Please try again later.",
});

export const loginIpLimiter = createLimiter({
    prefix: "recycleconnect:rl:login-ip:",

    windowMs: 15 * 60 * 1000,

    limit: 30,

    message:
        "Too many login attempts. Please try again later.",
});

export const loginEmailLimiter = createLimiter({
    prefix: "recycleconnect:rl:login-email:",

    windowMs: 15 * 60 * 1000,

    limit: 10,

    message:
        "Too many login attempts. Please try again later.",

    keyGenerator: (req) => {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "invalid-input";

        return createHash("sha256")
            .update(email)
            .digest("hex");
    },
});

export const refreshLimiter = createLimiter({
    prefix: "recycleconnect:rl:refresh:",

    windowMs: 15 * 60 * 1000,

    limit: 60,

    message:
        "Too many refresh requests. Please try again later.",
});

export const logoutLimiter = createLimiter({
    prefix: "recycleconnect:rl:logout:",

    windowMs: 15 * 60 * 1000,

    limit: 60,

    message:
        "Too many logout requests. Please try again later.",
});

export const sessionManagementLimiter = createLimiter({
    prefix: "recycleconnect:rl:sessions:",

    windowMs: 15 * 60 * 1000,

    limit: 60,

    message:
        "Too many session-management requests. Please try again later.",
});

export const passwordResetIpLimiter = createLimiter({
    prefix: "password-reset-ip:",
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: "Too many password reset requests. Please try again later.",
});

export const passwordResetEmailLimiter = createLimiter({
    prefix: "password-reset-email:",
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: "Too many password reset requests. Please try again later.",

    keyGenerator: (req) => {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "invalid-input";

        return createHash("sha256")
            .update(email)
            .digest("hex");
    },
});

export const verifyPasswordResetOtpIpLimiter =
    createLimiter({
        prefix: "verify-reset-otp-ip:",
        windowMs: 15 * 60 * 1000,
        limit: 30,
        message:
            "Too many verification attempts. Please try again later.",
    });

export const verifyPasswordResetOtpEmailLimiter =
    createLimiter({
        prefix: "verify-reset-otp-email:",
        windowMs: 60 * 60 * 1000,
        limit: 10,
        message:
            "Too many verification attempts. Please try again later.",

        keyGenerator: (req) => {
            const email =
                typeof req.body?.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "invalid-input";

            return createHash("sha256")
                .update(email)
                .digest("hex");
        },
    });

export const resetPasswordIpLimiter = createLimiter({
    prefix: "reset-password-ip:",
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message:
        "Too many password reset attempts. Please try again later.",
});

export const resendVerificationIpLimiter =
    createLimiter({
        prefix: "resend-verification-ip:",
        windowMs: 15 * 60 * 1000,
        limit: 20,
        message:
            "Too many verification email requests. Please try again later.",
    });

export const resendVerificationEmailLimiter =
    createLimiter({
        prefix: "resend-verification-email:",
        windowMs: 60 * 60 * 1000,
        limit: 5,
        message:
            "Too many verification email requests. Please try again later.",

        keyGenerator: (req) => {
            const email =
                typeof req.body?.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "invalid-input";

            return createHash("sha256")
                .update(email)
                .digest("hex");
        },
    });