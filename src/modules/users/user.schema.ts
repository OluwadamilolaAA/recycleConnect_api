import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
}).strict();

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(
        1,
        "Current password is required",
    ),

    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .refine(
            (password) =>
                Buffer.byteLength(password, "utf8") <= 72,
            "New password must not exceed 72 UTF-8 bytes",
        ),
}).strict();