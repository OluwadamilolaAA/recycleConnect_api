import type { Request, Response } from "express";
import { MaterialService } from "./material.service.js";
import { createMaterialSchema } from "./material.schema.js";


export class MaterialController {

    constructor(
        private readonly materialService = new MaterialService()
    ) {}

    create = async (req: Request, res: Response) => {
        const data = createMaterialSchema.parse(req.body);

        const material = await this.materialService.createMaterial(
            data.name,
        );

        res.status(201).json({
            success: true,
            message: "Material created successfully.",
            data: {
                material,
            },
        });
    };

    listActive = async (_req: Request, res: Response) => {
        const materials = await this.materialService.getActiveMaterials();

        res.status(200).json({
            success: true,
            data: {
                materials,
            },
        });
    };
}