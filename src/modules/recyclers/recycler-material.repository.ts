import { prisma } from "../../lib/prisma.js";

export class RecyclerMaterialRepository {
    findMaterial(materialId: string) {
        return prisma.material.findUnique({
            where: {
                id: materialId,
            },
            select: {
                id: true,
                isActive: true,
            },
        });
    }

    add(recyclerId: string, materialId: string) {
        return prisma.recyclerMaterial.upsert({
            where: {
                recyclerId_materialId: {
                    recyclerId,
                    materialId,
                },
            },

            create: {
                recyclerId,
                materialId,
            },

            update: {},

            select: {
                materialId: true,
                createdAt: true,
                material: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                },
            },
        });
    }

    findAllByRecyclerId(recyclerId: string) {
        return prisma.recyclerMaterial.findMany({
            where: {
                recyclerId,
            },

            select: {
                materialId: true,
                createdAt: true,
                material: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });
    }

    remove(recyclerId: string, materialId: string) {
        return prisma.recyclerMaterial.deleteMany({
            where: {
                recyclerId,
                materialId,
            },
        });
    }
}