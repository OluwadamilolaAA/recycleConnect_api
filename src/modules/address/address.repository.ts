import { prisma } from "../../lib/prisma.js";
import type { CreateAddressInput } from "./address.schema.js";

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
}