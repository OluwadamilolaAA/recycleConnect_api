import { Prisma } from "../../generated/prisma/client.js";
import { AUTH_CONFIG } from "../../config/auth.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { EmailService } from "../emails/email.service.js";
import { AuthRepository } from "./auth.repository.js";
import type { RegisterInput } from "./auth.types.js";
import { generateToken, hashToken } from "../../lib/tokens.js";
import BadRequestError from "../../common/errors/bad-request.js";

const REGISTRATION_MESSAGE =
    "If this email is valid, a verification email will be sent.";

export class AuthService {
    constructor(
        private readonly authRepository = new AuthRepository(),
        private readonly emailService = new EmailService(),
    ) { }
        //register
    async register(data: RegisterInput) {
        const passwordHash = await hashPassword(data.password);

        const existingUser = await this.authRepository.findByEmail(
            data.email,
        );

        if (existingUser) {
            return {
                message: REGISTRATION_MESSAGE,
            };
        }

        const verificationToken = generateToken();

        const tokenHash = hashToken(verificationToken);

        try {
            await prisma.$transaction(async (tx) => {
                const user = await this.authRepository.createUser(
                    {
                        name: data.name,
                        email: data.email,
                        role: data.role,
                        passwordHash,
                    },
                    tx,
                );

                const expiresAt = new Date(
                    Date.now() + AUTH_CONFIG.emailVerificationLifetimeMs,
                );

                await this.authRepository.createEmailVerificationToken(
                    {
                        userId: user.id,
                        tokenHash,
                        expiresAt,
                    },
                    tx,
                );

                await this.emailService.queueVerificationEmail(
                    {
                        to: user.email,
                        token: verificationToken,
                        expiresAt,
                    },
                    tx,
                );
            });
        } catch (error: unknown) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                const user = await this.authRepository.findByEmail(
                    data.email,
                );

                if (user) {
                    return {
                        message: REGISTRATION_MESSAGE,
                    };
                }
            }

            throw error;
        }

        return {
            message: REGISTRATION_MESSAGE,
        };
    }
    //verify-email
    async verifyEmail(token: string) {
        const tokenHash = hashToken(token);

        await prisma.$transaction(async (tx) => {
            const verification = await this.authRepository.findEmailVerificationByTokenHash(
                    tokenHash,
                    tx,
                );

            if (!verification) {
                throw new BadRequestError(
                    "This verification link is invalid or has expired. Request a new link.",
                );
            }

            const now = new Date();

            const result = await this.authRepository.consumeEmailVerificationToken(
                    verification.id,
                    now,
                    tx,
                );

            if (result.count !== 1) {
                throw new BadRequestError(
                    "This verification link has expired or has already been used.",
                );
            }

            await this.authRepository.markEmailVerified(
                verification.userId,
                now,
                tx,
            );
        });

        return {
            message: "Email verified successfully. You can now log in.",
        };
    }
}