import { prisma } from "../../lib/prisma.js";

export class MaterialRepository {
    findByName(name: string) {
        return prisma.material.findUnique({
            where: {
                name,
            },
        });
    }

    create(name: string) {
        return prisma.material.create({
            data: {
                name,
            },
        });
    }

    findActive() {
        return prisma.material.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: "asc",
            },
        });
    }
}