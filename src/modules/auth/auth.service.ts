import { Prisma } from "../../generated/prisma/client.js";
import { AUTH_CONFIG } from "../../config/auth.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { EmailService } from "../emails/email.service.js";
import { AuthRepository } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";
import { generateToken, hashToken } from "../../lib/tokens.js";
import BadRequestError from "../../common/errors/bad-request.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import ForbiddenError from "../../common/errors/forbidden.error.js";
import { createAccessToken } from "../../lib/access-token.js";

const REGISTRATION_MESSAGE =
    "If this email is valid, a verification email will be sent.";

const dummyPasswordHash = await hashPassword(generateToken());

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

    //Login
    async login(data: LoginInput, userAgent: string | null) {
        const user = await this.authRepository.findUserForLogin(data.email);

        const passwordValid = await verifyPassword(data.password, user?.passwordHash ?? dummyPasswordHash)

        if (!user || !passwordValid) {
            throw new UnauthorizedError("Invalid email or password")
        }

        const refreshToken = generateToken()

        const refreshTokenHash = hashToken(refreshToken)
        const result = await prisma.$transaction(async (tx) => {
            await this.authRepository.lockUserForLogin(user.id, tx)

            const account = await this.authRepository.findLoginAccountById(user.id, tx)
            if (!account || account.passwordHash !== user.passwordHash) {
                throw new UnauthorizedError("Your credentials changed. Please log in again.")
            }

            if (account.status !== "ACTIVE") {
                throw new ForbiddenError("Your account is unavailable. Contact support.")
            }

            if (!account.emailVerifiedAt) {
                throw new ForbiddenError("Verify your email before logging in.")
            }

            const now = Date.now()

            const sessionExpiresAt = new Date(now + AUTH_CONFIG.sessionLifetimeMs)

            const refreshTokenExpiresAt = new Date(now + AUTH_CONFIG.refreshTokenLifetimeMs)

            const session = await this.authRepository.createSession(
                {
                    userId: account.id,
                    userAgent: userAgent?.slice(0, 500) ?? null,
                    expiresAt: sessionExpiresAt
                },
                tx
            )

            await this.authRepository.createRefreshToken(
                {
                    sessionId: session.id,
                    tokenHash: refreshTokenHash,
                    expiresAt: refreshTokenExpiresAt
                },
                tx
            )

            const accessToken = createAccessToken({
                userId: account.id,
                sessionId: session.id
            })

            const { passwordHash: _passwordHash, ...safeUser } = account;

            return {
                user: safeUser,
                accessToken,
                refreshToken,
                refreshTokenExpiresAt
            }
        });

        return {
            ...result,
            tokenType: "Bearer" as const,
            expiresIn: AUTH_CONFIG.accessTokenLifetimeSeconds
        }
    }
}