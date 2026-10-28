import type { Request, Response } from "express";
import { UnauthorizedError } from "../../common/errors/index.js";
import { RecyclerMaterialService } from "./recycler-material.service.js";
import { addRecyclerMaterialSchema, recyclerMaterialParamsSchema } from "./recycler-material.schema.js";


export class RecyclerMaterialController {
    constructor(
        private readonly service = new RecyclerMaterialService()
    ){}

    add = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { materialId } = addRecyclerMaterialSchema.parse(req.body);

        const selection = await this.service.addMaterial(
            req.auth.userId,
            materialId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Accepted material saved successfully.",
            data: {
                selection,
            },
        });
    };

    list = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const materials = await this.service.getMyMaterials(
            req.auth.userId,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                materials,
            },
        });
    };

    remove = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const { materialId } = recyclerMaterialParamsSchema.parse(req.params);

        await this.service.removeMaterial(req.auth.userId, materialId);

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Accepted material removed successfully.",
        });
    };
}