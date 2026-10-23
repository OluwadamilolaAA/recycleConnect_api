import { rateLimit } from "express-rate-limit";

import { RedisStore } from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";

import { redis } from "../lib/redis.js";

type LimiterOptions = {
    prefix: string;
    windowMs: number;
    limit: number;
    message: string;
};

function createLimiter(options: LimiterOptions) {
    return rateLimit({
        windowMs: options.windowMs,

        limit: options.limit,

        standardHeaders: "draft-8",

        legacyHeaders: false,

        passOnStoreError: false,

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