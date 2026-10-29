import { z } from "zod";

const pickupItemSchema = z.object({
    materialId: z.string().uuid(),

    estimatedWeightKg: z
        .number()
        .positive()
        .max(9_999_999.999)
        .multipleOf(0.001)
        .optional(),
}).strict();

export const createPickupSchema = z.object({
    addressId: z.string().uuid(),

    notes: z.string().trim().min(1).max(1000).optional(),

    items: z
        .array(pickupItemSchema)
        .min(1, "Select at least one material")
        .max(20, "Select no more than 20 materials")
        .refine(
            (items) =>
                new Set(items.map((item) => item.materialId)).size ===
                items.length,
            "Each material can appear only once",
        ),
}).strict();

export type CreatePickupInput = z.infer<
    typeof createPickupSchema
>;