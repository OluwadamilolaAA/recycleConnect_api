import { ConflictError } from "../../common/errors/index.js";
import { MaterialRepository } from "./material.repository.js";

export class MaterialService {

    constructor(
        private readonly materialRepository= new MaterialRepository()
    ) {}

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
}