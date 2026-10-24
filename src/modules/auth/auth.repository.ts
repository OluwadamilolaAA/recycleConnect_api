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
}