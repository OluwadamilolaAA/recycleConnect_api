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