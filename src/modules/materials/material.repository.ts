import { prisma } from "../../lib/prisma.js";
import type { UpdateMaterialInput } from "./material.schema.js";

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

    findAll() {
        return prisma.material.findMany({
            orderBy: {
                name: "asc",
            },
        });
    }

    findById(materialId: string) {
        return prisma.material.findUnique({
            where: {
                id: materialId,
            },
        });
    }

    update(
        materialId: string,
        data: UpdateMaterialInput,
    ) {
        return prisma.material.updateMany({
            where: {
                id: materialId,
            },
            data,
        });
    }
}