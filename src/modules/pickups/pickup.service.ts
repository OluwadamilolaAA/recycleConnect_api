import BadRequestError from "../../common/errors/bad-request.js";
import ConflictError from "../../common/errors/conflict.error.js";
import NotFoundError from "../../common/errors/not-found.error.js";
import { prisma } from "../../lib/prisma.js";
import { PickupRepository } from "./pickup.repository.js";
import type { AvailablePickupsInput, CreatePickupInput } from "./pickup.schema.js";

export class PickupService {
    constructor(
        private readonly pickupRepository = new PickupRepository()
    ) { }

    async createPickup(householdId: string, data: CreatePickupInput) {
        return prisma.$transaction(async (tx) => {
            const address = await this.pickupRepository.findOwnedAddress(data.addressId, householdId, tx)

            if (!address) {
                throw new NotFoundError("Adress not found")
            }

            const materialIds = data.items.map((item) => item.materialId)

            const materials = await this.pickupRepository.findActiveMaterials(materialIds, tx)

            if (materials.length !== materialIds.length) {
                throw new BadRequestError("One or more selected materials are unavailable.");
            }

            const materialNames = new Map(
                materials.map((material) => [material.id, material.name])
            )

            const items = data.items.map((item) => {
                const materialName = materialNames.get(item.materialId);

                if (materialName === undefined) {
                    throw new BadRequestError(
                        "One or more selected materials are unavailable.",
                    );
                }

                return {
                    materialId: item.materialId,
                    materialName,

                    estimatedWeightKg:
                        item.estimatedWeightKg === undefined
                            ? null
                            : item.estimatedWeightKg.toString(),
                };
            })

            return this.pickupRepository.create(
                {
                    householdId,
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    country: address.country,
                    landmark: address.landmark,
                    notes: data.notes ?? null,
                    items,
                },
                tx,
            );
        })
    }

    async getMyPickups(householdId: string, page: number, limit: number) {
        const results = await this.pickupRepository.findAllByHouseholdId(
            householdId,
            page,
            limit
        )

        return {
            pickups: results.slice(0, limit),

            pagination: {
                page,
                limit,
                hasNextPage: results.length > limit,
            }
        }
    }

    async getMyPickup(pickupId: string, householdId: string) {
        const pickup = await this.pickupRepository.findOwnedPickup(pickupId, householdId)

        if (!pickup) {
            throw new NotFoundError("Pickup not found")
        }

        return pickup
    }

    async cancelMyPickup(pickupId: string, householdId: string) {
        const result = await this.pickupRepository.cancelPendingPickup(
            pickupId,
            householdId,
        );

        if (result.count === 1) {
            return {
                message: "Pickup request cancelled successfully.",
            };
        }

        const pickup = await this.pickupRepository.findOwnedPickup(
            pickupId,
            householdId,
        );

        if (!pickup) {
            throw new NotFoundError("Pickup request not found.");
        }

        // Repeating a successful cancellation is harmless.
        if (pickup.status === "CANCELLED") {
            return {
                message: "Pickup request cancelled successfully.",
            };
        }

        throw new ConflictError(
            "Only pending pickup requests can be cancelled.",
        );
    }

    async getAvailablePickups(data: AvailablePickupsInput) {
        const results = await this.pickupRepository.findAvailable(data);

        return {
            pickups: results.slice(0, data.limit),

            pagination: {
                page: data.page,
                limit: data.limit,
                hasNextPage: results.length > data.limit,
            },
        };
    }
}