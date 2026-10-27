import { prisma } from "../../lib/prisma.js";

export class UserRepository {
    findPublicUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                emailVerifiedAt: true,
                createdAt: true,
            }
        })
    }

    updateName(userId: string, name: string) {
        return prisma.user.updateMany({
            where: {
                id: userId,
                status: "ACTIVE"
            },
            data: {
                name
            }
        })
    }

    findPasswordForChange(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                passwordHash: true,
            },
        });
    }
}