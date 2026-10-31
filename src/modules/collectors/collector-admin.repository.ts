import { prisma } from "../../lib/prisma.js";
import type {CollectorApplicationStatus} from "./collector-admin.schema.js";

export class CollectorAdminRepository {
    listApplications(
        status: CollectorApplicationStatus,
        page: number,
        limit: number,
    ) {
        return prisma.collectorProfile.findMany({
            where: {
                approvalStatus: status,
            },

            select: {
                userId: true,
                approvalStatus: true,
                reviewedAt: true,
                reviewedById: true,
                rejectionReason: true,
                createdAt: true,
                updatedAt: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },

            orderBy: [
                { createdAt: "asc" },
                { userId: "asc" },
            ],

            skip: (page - 1) * limit,
            take: limit + 1,
        });
    }

    findApplication(collectorId: string) {
        return prisma.collectorProfile.findUnique({
            where: {
                userId: collectorId,
            },

            select: {
                userId: true,
                approvalStatus: true,
                reviewedAt: true,
                reviewedById: true,
                rejectionReason: true,

                user: {
                    select: {
                        role: true,
                        status: true,
                    },
                },
            },
        });
    }

    reviewPendingApplication(data: {
        collectorId: string;
        adminId: string;
        decision: "APPROVED" | "REJECTED";
        rejectionReason: string | null;
        reviewedAt: Date;
    }) {
        return prisma.collectorProfile.updateMany({
            where: {
                userId: data.collectorId,
                approvalStatus: "PENDING",

                user: {
                    role: "COLLECTOR",
                    status: "ACTIVE",
                },
            },

            data: {
                approvalStatus: data.decision,
                reviewedAt: data.reviewedAt,
                reviewedById: data.adminId,
                rejectionReason: data.rejectionReason,
            },
        });
    }
}