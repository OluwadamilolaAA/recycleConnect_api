import { z } from "zod";

export const createAddressSchema = z.object({
    label: z.string().trim().min(1).max(50),

    street: z.string().trim().min(1).max(255),

    city: z.string().trim().min(1).max(100),

    state: z.string().trim().min(1).max(100),

    country: z.string().trim().min(1).max(100),

    landmark: z.string().trim().min(1).max(255).optional(),
}).strict();

export type CreateAddressInput = z.infer<
    typeof createAddressSchema
>;

export const addressParamsSchema = z.object({
    addressId: z.string().uuid(),
});

export const updateAddressSchema = z.object({
    label: z.string().trim().min(1).max(50).optional(),

    street: z.string().trim().min(1).max(255).optional(),

    city: z.string().trim().min(1).max(100).optional(),

    state: z.string().trim().min(1).max(100).optional(),

    country: z.string().trim().min(1).max(100).optional(),

    landmark: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .nullable()
        .optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
);

export type UpdateAddressInput = z.infer<
    typeof updateAddressSchema
>;