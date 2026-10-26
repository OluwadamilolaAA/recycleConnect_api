import {createHmac, randomInt, timingSafeEqual} from "node:crypto";
import { env } from "../../config/env.js";

const passwordResetKey = Buffer.from(
    env.PASSWORD_RESET_SECRET,
    "hex",
);

export function generatePasswordResetOtp(): string {
    return randomInt(0, 1_000_000)
        .toString()
        .padStart(6, "0");
}

export function hashPasswordResetOtp(challengeId: string, otp: string): string {
    return createHmac("sha256", passwordResetKey)
        .update(`password-reset:${challengeId}:${otp}`)
        .digest("hex");
}

export function verifyPasswordResetOtp(challengeId: string, otp: string, storedHash: string): boolean {
    if (!/^\d{6}$/.test(otp)) {
        return false;
    }

    if (!/^[a-fA-F0-9]{64}$/.test(storedHash)) {
        return false;
    }

    const candidateHash = hashPasswordResetOtp(
        challengeId,
        otp,
    );

    return timingSafeEqual(
        Buffer.from(candidateHash, "hex"),
        Buffer.from(storedHash, "hex"),
    );
}