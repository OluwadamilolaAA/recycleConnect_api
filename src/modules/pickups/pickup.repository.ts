import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { AvailablePickupsInput, ListAssignedPickupsInput } from "./pickup.schema.js";

export class PickupRepository {
    findOwnedAddress(
        addressId: string,
        householdId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.address.findFirst({
            where: {
                id: addressId,
                userId: householdId,
            },
        });
    }

    findActiveMaterials(
        materialIds: string[],
        tx: Prisma.TransactionClient,
    ) {
        return tx.material.findMany({
            where: {
                id: {
                    in: materialIds,
                },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
            },
        });
    }

    create(
        data: {
            householdId: string;
            street: string;
            city: string;
            state: string;
            country: string;
            landmark: string | null;
            notes: string | null;

            items: {
                materialId: string;
                materialName: string;
                estimatedWeightKg: string | null;
            }[];
        },
        tx: Prisma.TransactionClient,
    ) {
        return tx.pickupRequest.create({
            data: {
                householdId: data.householdId,
                street: data.street,
                city: data.city,
                state: data.state,
                country: data.country,
                landmark: data.landmark,
                notes: data.notes,

                items: {
                    create: data.items,
                },
            },

            include: {
                items: true,
            },
        });
    }

    findAllByHouseholdId(
        householdId: string,
        page: number,
        limit: number,
    ) {
        return prisma.pickupRequest.findMany({
            where: {
                householdId,
            },

            include: {
                items: true,
            },

            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],

            skip: (page - 1) * limit,

            // Fetch one extra record to check for another page.
            take: limit + 1,
        });
    }

    findOwnedPickup(
        pickupId: string,
        householdId: string,
    ) {
        return prisma.pickupRequest.findFirst({
            where: {
                id: pickupId,
                householdId,
            },

            include: {
                items: true,
            },
        });
    }

    cancelPendingPickup(
        pickupId: string,
        householdId: string,
    ) {
        return prisma.pickupRequest.updateMany({
            where: {
                id: pickupId,
                householdId,
                status: "PENDING",
            },
            data: {
                status: "CANCELLED",
            },
        });
    }

    findAvailable(data: AvailablePickupsInput) {
        return prisma.pickupRequest.findMany({
            where: {
                status: "PENDING",
                collectorId: null,

                household: {
                    role: "HOUSEHOLD",
                    status: "ACTIVE",
                    emailVerifiedAt: {
                        not: null,
                    },
                },

                ...(data.city
                    ? {
                        city: {
                            equals: data.city,
                            mode: "insensitive",
                        },
                    }
                    : {}),

                ...(data.state
                    ? {
                        state: {
                            equals: data.state,
                            mode: "insensitive",
                        },
                    }
                    : {}),
            },

            select: {
                id: true,
                city: true,
                state: true,
                country: true,
                createdAt: true,

                items: {
                    select: {
                        materialId: true,
                        materialName: true,
                        estimatedWeightKg: true,
                    },
                },
            },

            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
            ],

            skip: (data.page - 1) * data.limit,
            take: data.limit + 1,
        });
    }

    findCollectorApproval(
        collectorId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.collectorProfile.findUnique({
            where: {
                userId: collectorId,
            },
            select: {
                approvalStatus: true,
            },
        });
    }

    claimPendingPickup(
        pickupId: string,
        collectorId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.pickupRequest.updateMany({
            where: {
                id: pickupId,
                status: "PENDING",
                collectorId: null,

                household: {
                    role: "HOUSEHOLD",
                    status: "ACTIVE",
                    emailVerifiedAt: {
                        not: null,
                    },
                },
            },

            data: {
                collectorId,
                status: "CLAIMED",
            },
        });
    }

    findPickupClaimState(
        pickupId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.pickupRequest.findUnique({
            where: {
                id: pickupId,
            },
            select: {
                collectorId: true,
                status: true,
            },
        });
    }

    findClaimedPickup(
        pickupId: string,
        collectorId: string,
        tx: Prisma.TransactionClient,
    ) {
        return tx.pickupRequest.findFirst({
            where: {
                id: pickupId,
                collectorId,
            },
            include: {
                items: true,
            },
        });
    }

    findAssignedPickups(
        collectorId: string,
        data: ListAssignedPickupsInput,
    ) {
        return prisma.pickupRequest.findMany({
            where: {
                collectorId,

                ...(data.status
                    ? { status: data.status }
                    : {}),
            },

            include: {
                items: true,
            },

            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],

            skip: (data.page - 1) * data.limit,
            take: data.limit + 1,
        });
    }

    findAssignedPickup(
        pickupId: string,
        collectorId: string,
    ) {
        return prisma.pickupRequest.findFirst({
            where: {
                id: pickupId,
                collectorId,
            },

            include: {
                items: true,
            },
        });
    }
}