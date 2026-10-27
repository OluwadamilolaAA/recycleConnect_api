import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { RegisterInput } from "./auth.types.js";

const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    emailVerifiedAt: true,
    createdAt: true,
} satisfies Prisma.UserSelect;

type CreateUserData = Omit<RegisterInput, "password"> & {
    passwordHash: string;
};

type CreateEmailVerificationTokenData = {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
};

type CreateSessionData = {
    userId: string;
    userAgent: string | null;
    expiresAt: Date;
};

type CreateRefreshTokenData = {
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
};

export class AuthRepository {
    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            select: { id: true }
        })
    }

    createUser(data: CreateUserData, tx: Prisma.TransactionClient) {
        return tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                passwordHash: data.passwordHash
            },
            select: publicUserSelect
        });
    }

    createEmailVerificationToken(data: CreateEmailVerificationTokenData, tx: Prisma.TransactionClient) {
        return tx.emailVerificationToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt
            },
            select: { id: true }
        })
    }

    findEmailVerificationByTokenHash(tokenHash: string, tx: Prisma.TransactionClient) {
        return tx.emailVerificationToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true
            }
        })
    }

    consumeEmailVerificationToken(id: string, consumedAt: Date, tx: Prisma.TransactionClient) {
        return tx.emailVerificationToken.updateMany({
            where: {
                id,
                consumedAt: null,
                expiresAt: {
                    gt: consumedAt
                }
            },
            data: {
                consumedAt
            }
        })
    }

    markEmailVerified(userId: string, verifiedAt: Date, tx: Prisma.TransactionClient) {
        return tx.user.updateMany({
            where: {
                id: userId,
                emailVerifiedAt: null
            },
            data: {
                emailVerifiedAt: verifiedAt
            }
        })
    }

    findUserForLogin(email: string) {
        return prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                passwordHash: true
            }
        })
    }

    async lockUserForLogin(userId: string, tx: Prisma.TransactionClient) {
        await tx.$queryRaw`
    SELECT "id"
    FROM public."User"
    WHERE "id" = ${userId}::uuid
    FOR UPDATE
  `;
    }

    findLoginAccountById(userId: string, tx: Prisma.TransactionClient) {
        return tx.user.findUnique({
            where: {
                id: userId
            },
            select: {
                ...publicUserSelect,
                passwordHash: true
            }
        })
    }

    createSession(data: CreateSessionData, tx: Prisma.TransactionClient) {
        return tx.session.create({
            data: {
                userId: data.userId,
                userAgent: data.userId,
                expiresAt: data.expiresAt
            },
            select: {
                id: true,
                expiresAt: true
            }
        })
    }

    createRefreshToken(data: CreateRefreshTokenData, tx: Prisma.TransactionClient) {
        return tx.refreshToken.create({
            data: {
                sessionId: data.sessionId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt
            },
            select: {
                id: true
            }
        })
    }

    findPublicUserById(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: publicUserSelect,
        });
    }

    findRefreshTokenByHash(tokenHash: string, tx?: Prisma.TransactionClient) {
        const client = tx ?? prisma;

        return client.refreshToken.findUnique({
            where: {
                tokenHash,
            },

            include: {
                session: {
                    include: {
                        user: {
                            select: {
                                status: true,
                                emailVerifiedAt: true,
                            },
                        },
                    },
                },
            },
        });
    }

    consumeRefreshToken(id: string, consumedAt: Date, tx: Prisma.TransactionClient) {
        return tx.refreshToken.updateMany({
            where: {
                id,
                consumedAt: null,
                expiresAt: {
                    gt: consumedAt,
                },
            },

            data: {
                consumedAt,
            },
        });
    }

    revokeSession(sessionId: string, revokedAt: Date, tx: Prisma.TransactionClient) {
        return tx.session.updateMany({
            where: {
                id: sessionId,
                revokedAt: null,
            },

            data: {
                revokedAt,
            },
        });
    }

    findActiveSession(userId: string, sessionId: string, tx?: Prisma.TransactionClient) {
        const db = tx ?? prisma

        return db.session.findFirst({
            where: {
                id: sessionId,
                userId,

                revokedAt: null,

                expiresAt: {
                    gt: new Date(),
                },

                user: {
                    status: "ACTIVE",

                    emailVerifiedAt: {
                        not: null
                    }
                }
            },
            select: {
                id: true
            }

        })
    }

    listActiveSessions(userId: string) {
        return prisma.session.findMany({
            where: {
                userId,

                revokedAt: null,

                expiresAt: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true
            },
            orderBy: [
                {
                    createdAt: "desc"
                },
                {
                    id: "desc"
                }
            ],
            take: 50
        })
    }

    revokeOwnedSession(
        userId: string,
        sessionId: string,
        revokedAt: Date,
        tx: Prisma.TransactionClient,
    ) {
        return tx.session.updateMany({
            where: {
                id: sessionId,
                userId,

                revokedAt: null,

                expiresAt: {
                    gt: revokedAt,
                },
            },

            data: {
                revokedAt,
            },
        });
    }

    findPasswordResetAccountById(
        userId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                email: true,
                status: true,
            },
        });
    }

    findLatestPasswordResetChallenge(userId: string, tx: Prisma.TransactionClient) {
        return tx.passwordResetChallenge.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    invalidatePasswordResetChallenges(
        userId: string,
        consumedAt: Date,
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.updateMany({
            where: {
                userId,
                consumedAt: null,
            },
            data: {
                consumedAt,
            },
        });
    }

    createPasswordResetChallenge(
        data: {
            id: string;
            userId: string;
            otpHash: string;
            expiresAt: Date;
        },
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.create({
            data: {
                id: data.id,
                userId: data.userId,
                otpHash: data.otpHash,
                expiresAt: data.expiresAt,
            },
        });
    }

    findPasswordResetChallenge(
        challengeId: string,
        userId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.findFirst({
            where: {
                id: challengeId,
                userId,
            },
        });
    }

    incrementPasswordResetAttempts(
        challengeId: string,
        now: Date,
        maxAttempts: number,
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.updateMany({
            where: {
                id: challengeId,
                consumedAt: null,
                verifiedAt: null,
                expiresAt: {
                    gt: now,
                },
                attempts: {
                    lt: maxAttempts,
                },
            },
            data: {
                attempts: {
                    increment: 1,
                },
            },
        });
    }

    markPasswordResetOtpVerified(
        data: {
            challengeId: string;
            verifiedAt: Date;
            resetTokenHash: string;
            resetExpiresAt: Date;
            maxAttempts: number;
        },
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.updateMany({
            where: {
                id: data.challengeId,
                consumedAt: null,
                verifiedAt: null,
                expiresAt: {
                    gt: data.verifiedAt,
                },
                attempts: {
                    lt: data.maxAttempts,
                },
            },
            data: {
                verifiedAt: data.verifiedAt,
                resetTokenHash: data.resetTokenHash,
                resetExpiresAt: data.resetExpiresAt,
            },
        });
    }

    findPasswordResetChallengeByResetTokenHash(
        resetTokenHash: string,
        tx?: Prisma.TransactionClient,
    ) {

        const db = tx ?? prisma
        return db.passwordResetChallenge.findUnique({
            where: {
                resetTokenHash,
            },
        });
    }

    consumePasswordResetChallenge(
        challengeId: string,
        now: Date,
        tx: Prisma.TransactionClient,
    ) {
        return tx.passwordResetChallenge.updateMany({
            where: {
                id: challengeId,
                consumedAt: null,
                verifiedAt: {
                    not: null,
                },
                resetTokenHash: {
                    not: null,
                },
                resetExpiresAt: {
                    gt: now,
                },
            },
            data: {
                consumedAt: now,
            },
        });
    }

    updatePassword(
        userId: string,
        passwordHash: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.user.update({
            where: {
                id: userId,
            },
            data: {
                passwordHash,
            },
        });
    }

    revokeAllUserSessions(
        userId: string,
        revokedAt: Date,
        tx: Prisma.TransactionClient,
    ) {
        return tx.session.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt,
            },
        });
    }
    
}