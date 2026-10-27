import { z } from "zod";

export const createMaterialSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Material name must be at least 2 characters")
        .max(100, "Material name must not exceed 100 characters")
        .transform((name) => name.toLowerCase()),
}).strict();

export type CreateMaterialInput = z.infer<
    typeof createMaterialSchema
>;