import { prisma } from "../../lib/prisma.js";
import type { CreateAddressInput, UpdateAddressInput } from "./address.schema.js";

export class AddressRepository {
    create(userId: string, data: CreateAddressInput) {
        return prisma.address.create({
            data: {
                userId,
                label: data.label,
                street: data.street,
                city: data.city,
                state: data.state,
                country: data.country,
                landmark: data.landmark,
            }
        })
    }

    findAllByUserId(userId: string){
        return prisma.address.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    findOwnedAddress(userId: string, addressId: string){
        return prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        })
    }

    updateOwnedAddress(userId: string, addressId: string, data: UpdateAddressInput){
        return prisma.address.updateMany({
            where: {
                id: addressId,
                userId
            },
            data
        })
    }

    deleteOwnedAddress(userId: string, addressId: string){
        return prisma.address.deleteMany({
            where: {
                id: addressId,
                userId
            }
        })
    }
}