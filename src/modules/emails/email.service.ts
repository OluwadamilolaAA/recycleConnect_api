import type { Prisma } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { EmailRepository } from "./email.repository.js";

type VerificationEmailData = {
    to: string;
    token: string;
    expiresAt: Date;
};

export class EmailService {
    constructor(
        private readonly emailRepository = new EmailRepository(),
    ) { }

    queueVerificationEmail(
        data: VerificationEmailData,
        tx: Prisma.TransactionClient,
    ) {
        const verificationUrl = new URL(env.VERIFY_EMAIL_URL);

        verificationUrl.searchParams.set("token", data.token);

        const text = [
            "Welcome to RecycleConnect.",
            "",
            "Open this link to confirm your email address:",
            verificationUrl.toString(),
            "",
            `This link expires at ${data.expiresAt.toUTCString()}.`,
            "",
            "If you did not create this account, ignore this email.",
        ].join("\n");

        return this.emailRepository.create(
            {
                to: data.to,
                subject: "Verify your email for RecycleConnect",
                text,
                expiresAt: data.expiresAt,
            },
            tx,
        );
    }

    async queuePasswordResetOtp(
        data: {
            to: string;
            otp: string;
            expiresAt: Date;
        },
        tx: Prisma.TransactionClient,
    ) {
        const text = [
            "You requested a password reset for your RecycleConnect account.",
            "",
            `Your password reset code is: ${data.otp}`,
            "",
            `This code expires at ${data.expiresAt.toUTCString()}.`,
            "",
            "If you did not request a password reset, you can ignore this email.",
        ].join("\n");

        return this.emailRepository.create(
            {
                to: data.to,
                subject: "Your RecycleConnect password reset code",
                text,
                expiresAt: data.expiresAt,
            },
            tx,
        );
    }
}