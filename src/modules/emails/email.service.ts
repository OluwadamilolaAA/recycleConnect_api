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
}