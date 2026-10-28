import { ConflictError, NotFoundError } from "../../common/errors/index.js";
import { MaterialRepository } from "./material.repository.js";
import type { UpdateMaterialInput } from "./material.schema.js";

export class MaterialService {

    constructor(
        private readonly materialRepository = new MaterialRepository()
    ) { }

    async createMaterial(name: string) {
        const existingMaterial = await this.materialRepository.findByName(name);

        if (existingMaterial) {
            throw new ConflictError("A material with this name already exists.");
        }

        return this.materialRepository.create(name);
    }

    async getActiveMaterials() {
        return this.materialRepository.findActive();
    }

    async getAllMaterials() {
        return this.materialRepository.findAll();
    }

    async updateMaterial(materialId: string, data: UpdateMaterialInput) {
        const result = await this.materialRepository.update(
            materialId,
            data,
        );

        if (result.count !== 1) {
            throw new NotFoundError("Material not found.");
        }

        const material = await this.materialRepository.findById(materialId);

        if (!material) {
            throw new NotFoundError("Material not found.");
        }

        return material;
    }
}