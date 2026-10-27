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
import NotFoundError from "../../common/errors/not-found.error.js";
import { generatePasswordResetOtp, hashPasswordResetOtp, verifyPasswordResetOtp } from "../../common/utils/password-reset.util.js";
import { randomUUID } from "node:crypto";

const REGISTRATION_MESSAGE =
    "If registration can proceed, you’ll receive a verification email. If you already have an account, please sign in.";

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

    //Refresh token
    async refresh(refreshToken: string) {
        const tokenHash = hashToken(refreshToken);

        const existingToken = await this.authRepository.findRefreshTokenByHash(
            tokenHash,
        );

        if (!existingToken) {
            throw new UnauthorizedError(
                "Invalid refresh token. Please log in again.",
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            await this.authRepository.lockUserForLogin(
                existingToken.session.userId,
                tx,
            );

            // Read again after acquiring the lock.
            const currentToken = await this.authRepository.findRefreshTokenByHash(
                tokenHash,
                tx,
            );

            if (!currentToken) {
                return null;
            }

            const session = currentToken.session;

            const now = new Date();

            if (
                session.revokedAt ||
                session.expiresAt <= now
            ) {
                return null;
            }

            // A previously used token has been submitted again.
            if (currentToken.consumedAt) {
                await this.authRepository.revokeSession(
                    session.id,
                    now,
                    tx,
                );

                // Return instead of throwing so revocation commits.
                return null;
            }

            if (
                currentToken.expiresAt <= now ||
                session.user.status !== "ACTIVE" ||
                !session.user.emailVerifiedAt
            ) {
                return null;
            }

            const consumed =
                await this.authRepository.consumeRefreshToken(
                    currentToken.id,
                    now,
                    tx,
                );

            if (consumed.count !== 1) {
                return null;
            }

            const newRefreshToken = generateToken();

            const refreshTokenExpiresAt = new Date(
                Math.min(
                    now.getTime() + AUTH_CONFIG.refreshTokenLifetimeMs,
                    session.expiresAt.getTime(),
                ),
            );

            await this.authRepository.createRefreshToken(
                {
                    sessionId: session.id,
                    tokenHash: hashToken(newRefreshToken),
                    expiresAt: refreshTokenExpiresAt,
                },
                tx,
            );

            const accessToken = createAccessToken({
                userId: session.userId,
                sessionId: session.id,
            });

            return {
                accessToken,
                refreshToken: newRefreshToken,
                refreshTokenExpiresAt,
            };
        });

        if (!result) {
            throw new UnauthorizedError(
                "Session expired or revoked. Please log in again.",
            );
        }

        return {
            ...result,
            tokenType: "Bearer" as const,
            expiresIn: AUTH_CONFIG.accessTokenLifetimeSeconds,
        };
    }

    //logout

    async logout(refreshToken?: string) {
        if (refreshToken) {
            const tokenHash = hashToken(refreshToken);

            const existingToken = await this.authRepository.findRefreshTokenByHash(tokenHash)

            if (existingToken) {
                await prisma.$transaction(async (tx) => {
                    await this.authRepository.lockUserForLogin(
                        existingToken.session.userId,
                        tx
                    )

                    await this.authRepository.revokeSession(
                        existingToken.sessionId,
                        new Date(),
                        tx)
                })
            }
        }

        return {
            message: "Logged out successfully"
        }

    }

    //List Sessions
    async listSessions(userId: string, currentSessionId: string) {
        const sessions = await this.authRepository.listActiveSessions(userId);

        return {
            sesssion: sessions.map((session) => ({
                isCurrent: session.id === currentSessionId
            })),
            limit: 50
        }
    }

    //revoke device session
    async revokeDeviceSession(
        userId: string,
        currentSessionId: string,
        targetSessionId: string
    ) {
        await prisma.$transaction(async (tx) => {
            await this.authRepository.lockUserForLogin(userId, tx);

            const currentSession = await this.authRepository.findActiveSession(
                userId, currentSessionId, tx
            )

            if (!currentSession) {
                throw new UnauthorizedError(
                    "Session expired or revoked. Please log in again.",
                );
            }

            const result = await this.authRepository.revokeOwnedSession(
                userId, targetSessionId, new Date(), tx
            )

            if (result.count !== 1) {
                throw new NotFoundError("Active session not found.");
            }
        })

        return {
            message: "Session revoked successfully.",
        };
    }

    // reset-password
    async requestPasswordReset(email: string) {
        const message =
            "If an eligible account exists for this email, " +
            "a password reset code will be sent.";

        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.authRepository.findByEmail(normalizedEmail);

        if (!user) {
            return { message };
        }

        await prisma.$transaction(async (tx) => {
            // Coordinate this request with other account operations.
            await this.authRepository.lockUserForLogin(
                user.id,
                tx,
            );

            // Read the account again after acquiring the lock.
            const account = await this.authRepository.findPasswordResetAccountById(
                user.id,
                tx,
            );

            if (
                !account ||
                account.status !== "ACTIVE"
            ) {
                return;
            }

            const now = new Date();

            const latestChallenge = await this.authRepository.findLatestPasswordResetChallenge(
                account.id,
                tx,
            );

            if (latestChallenge) {
                const nextAllowedTime =
                    latestChallenge.createdAt.getTime() +
                    AUTH_CONFIG.passwordResetResendCooldownMs;

                if (now.getTime() < nextAllowedTime) {
                    return;
                }
            }

            const challengeId = randomUUID();
            const otp = generatePasswordResetOtp();

            const otpHash = hashPasswordResetOtp(
                challengeId,
                otp,
            );

            const expiresAt = new Date(
                now.getTime() + AUTH_CONFIG.passwordResetOtpLifetimeMs,
            );

            await this.authRepository.invalidatePasswordResetChallenges(
                account.id,
                now,
                tx,
            );

            await this.authRepository.createPasswordResetChallenge(
                {
                    id: challengeId,
                    userId: account.id,
                    otpHash,
                    expiresAt,
                },
                tx,
            );

            await this.emailService.queuePasswordResetOtp(
                {
                    to: account.email,
                    otp,
                    expiresAt,
                },
                tx,
            );
        });

        return { message };
    }

    //verify reset otp
    async verifyPasswordResetOtp(email: string, otp: string) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.authRepository.findByEmail(normalizedEmail);

        if (!user) {
            throw new BadRequestError(
                "Invalid or expired password reset code.",
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            await this.authRepository.lockUserForLogin(
                user.id,
                tx,
            );

            const account = await this.authRepository.findPasswordResetAccountById(
                user.id,
                tx,
            );

            if (
                !account ||
                account.status !== "ACTIVE" ||
                account.email !== normalizedEmail
            ) {
                return null;
            }

            const challenge = await this.authRepository.findLatestPasswordResetChallenge(
                account.id,
                tx,
            );

            const now = new Date();

            if (
                !challenge ||
                challenge.consumedAt ||
                challenge.verifiedAt ||
                challenge.expiresAt <= now ||
                challenge.attempts >=
                AUTH_CONFIG.passwordResetMaxAttempts
            ) {
                return null;
            }

            const otpIsValid = verifyPasswordResetOtp(
                challenge.id,
                otp,
                challenge.otpHash,
            );

            if (!otpIsValid) {
                await this.authRepository.incrementPasswordResetAttempts(
                    challenge.id,
                    now,
                    AUTH_CONFIG.passwordResetMaxAttempts,
                    tx,
                );

                return null;
            }

            const resetToken = generateToken();
            const resetTokenHash = hashToken(resetToken);

            const resetExpiresAt = new Date(
                now.getTime() + AUTH_CONFIG.passwordResetTokenLifetimeMs,
            );

            const updated =
                await this.authRepository.markPasswordResetOtpVerified(
                    {
                        challengeId: challenge.id,
                        verifiedAt: now,
                        resetTokenHash,
                        resetExpiresAt,
                        maxAttempts:
                            AUTH_CONFIG.passwordResetMaxAttempts,
                    },
                    tx,
                );

            if (updated.count !== 1) {
                return null;
            }

            return {
                resetToken,
                resetExpiresAt,
            };
        });

        if (!result) {
            throw new BadRequestError(
                "Invalid or expired password reset code.",
            );
        }

        return result;
    }

    // reset password
    async resetPassword(
        resetToken: string,
        newPassword: string,
    ) {
        const resetTokenHash = hashToken(resetToken);

        // Find the user ID so we know which user row to lock.
        const existingChallenge =
            await this.authRepository.findPasswordResetChallengeByResetTokenHash(
                resetTokenHash,
            );

        if (!existingChallenge) {
            throw new BadRequestError(
                "Invalid or expired password reset token.",
            );
        }

        // bcrypt is intentionally slow, so hash before opening
        // the database transaction.
        const passwordHash = await hashPassword(newPassword);

        const resetCompleted = await prisma.$transaction(
            async (tx) => {
                await this.authRepository.lockUserForLogin(
                    existingChallenge.userId,
                    tx,
                );

                // Read the challenge again after acquiring the lock.
                const challenge =
                    await this.authRepository.findPasswordResetChallengeByResetTokenHash(
                        resetTokenHash,
                        tx,
                    );

                if (
                    !challenge ||
                    challenge.userId !== existingChallenge.userId
                ) {
                    return false;
                }

                const account =
                    await this.authRepository.findPasswordResetAccountById(
                        challenge.userId,
                        tx,
                    );

                if (!account || account.status !== "ACTIVE") {
                    return false;
                }

                const now = new Date();

                const consumed =
                    await this.authRepository.consumePasswordResetChallenge(
                        challenge.id,
                        now,
                        tx,
                    );

                if (consumed.count !== 1) {
                    return false;
                }

                await this.authRepository.updatePassword(
                    account.id,
                    passwordHash,
                    tx,
                );

                await this.authRepository.revokeAllUserSessions(
                    account.id,
                    now,
                    tx,
                );

                return true;
            },
        );

        if (!resetCompleted) {
            throw new BadRequestError(
                "Invalid or expired password reset token.",
            );
        }

        return {
            message: "Password reset successfully.",
        };
    }

    async resendVerificationEmail(email: string) {
        const message =
            "If an eligible account exists for this email, " +
            "a verification email will be sent.";

        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.authRepository.findByEmail(
            normalizedEmail,
        );

        if (!user) {
            return { message };
        }

        await prisma.$transaction(async (tx) => {
            await this.authRepository.lockUserForLogin(
                user.id,
                tx,
            );

            const account =
                await this.authRepository.findEmailVerificationAccountById(
                    user.id,
                    tx,
                );

            if (
                !account ||
                account.email !== normalizedEmail ||
                account.status !== "ACTIVE" ||
                account.emailVerifiedAt !== null
            ) {
                return;
            }

            const now = new Date();

            const latestToken =
                await this.authRepository.findLatestEmailVerificationToken(
                    account.id,
                    tx,
                );

            if (latestToken) {
                const nextAllowedTime =
                    latestToken.createdAt.getTime() +
                    AUTH_CONFIG.emailVerificationResendCooldownMs;

                if (now.getTime() < nextAllowedTime) {
                    return;
                }
            }

            const verificationToken = generateToken();

            const tokenHash = hashToken(verificationToken);

            const expiresAt = new Date(
                now.getTime() +
                AUTH_CONFIG.emailVerificationLifetimeMs,
            );

            await this.authRepository.invalidateEmailVerificationTokens(
                account.id,
                now,
                tx,
            );

            await this.authRepository.createEmailVerificationToken(
                {
                    userId: account.id,
                    tokenHash,
                    expiresAt,
                },
                tx,
            );

            await this.emailService.queueVerificationEmail(
                {
                    to: account.email,
                    token: verificationToken,
                    expiresAt,
                },
                tx,
            );
        });

        return { message };
    }
}