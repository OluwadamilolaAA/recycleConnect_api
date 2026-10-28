import { BadRequestError, NotFoundError,} from "../../common/errors/index.js";
import { RecyclerMaterialRepository } from "./recycler-material.repository.js";

export class RecyclerMaterialService {
    constructor(
        private readonly repository = new RecyclerMaterialRepository()
    ){}
    async addMaterial( recyclerId: string,  materialId: string) {
        const material = await this.repository.findMaterial(materialId);

        if (!material) {
            throw new NotFoundError("Material not found.");
        }

        if (!material.isActive) {
            throw new BadRequestError("This material is currently unavailable.");
        }

        return this.repository.add(recyclerId, materialId);
    }

    async getMyMaterials(recyclerId: string) {
        return this.repository.findAllByRecyclerId(recyclerId);
    }

    async removeMaterial(recyclerId: string, materialId: string) {
        const result = await this.repository.remove(recyclerId, materialId);

        if (result.count !== 1) {
            throw new NotFoundError(
                "Material selection not found.",
            );
        }
    }
}