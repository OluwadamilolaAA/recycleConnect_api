import { z } from "zod";

export const addRecyclerMaterialSchema = z.object({
    materialId: z.string().uuid(),
}).strict();

export const recyclerMaterialParamsSchema = z.object({
    materialId: z.string().uuid(),
});