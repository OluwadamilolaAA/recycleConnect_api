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
}