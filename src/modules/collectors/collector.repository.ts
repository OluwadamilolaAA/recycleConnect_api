import { prisma } from "../../lib/prisma.js";

export class CollectorRepository {
    submitApplicationUserId(userId: string) {
        return prisma.collectorProfile.upsert({
            where: {
                userId
            },

            create: {
                userId
            },

            update: {},

            select: {
                approvalStatus: true,
                reviewedAt: true,
                rejectionReason: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    }

    findApplicationByUserId(userId: string) {
        return prisma.collectorProfile.findUnique({
            where: {
                userId
            },

            select: {
                approvalStatus: true,
                reviewedAt: true,
                rejectionReason: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    }
}