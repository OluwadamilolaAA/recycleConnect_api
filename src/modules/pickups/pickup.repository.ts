import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

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
}