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

export class AuthRepository{
    findByEmail(email: string){
        return prisma.user.findUnique({
            where: { email },
            select: { id: true}
        })
    }

    createUser(data: CreateUserData, tx: Prisma.TransactionClient){
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

    createEmailVerificationToken(data: CreateEmailVerificationTokenData, tx: Prisma.TransactionClient){
        return tx.emailVerificationToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt
            },
            select: { id: true}
        })
    }

    findEmailVerificationByTokenHash(tokenHash: string, tx: Prisma.TransactionClient){
        return tx.emailVerificationToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true
            }
        })
    }

    consumeEmailVerificationToken(id: string, consumedAt: Date, tx: Prisma.TransactionClient){
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

    markEmailVerified(userId: string, verifiedAt: Date, tx: Prisma.TransactionClient){
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
}