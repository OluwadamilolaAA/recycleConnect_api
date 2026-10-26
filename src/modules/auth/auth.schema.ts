import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .lowercase()
  .email("Enter a valid email address")
  .max(254, "Email cannot exceed 254 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must contain atleast 8 characters")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password cannot exceed 72 UTF-8 bytes",
  );

export const registerSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: emailSchema,

  password: passwordSchema,

  role: z.enum(["HOUSEHOLD", "COLLECTOR", "RECYCLER"]).default("HOUSEHOLD"),
});

export const loginSchema = z.strictObject({
  email: emailSchema,

  password: z
    .string()
    .min(8, "Password is required")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password cannot exceed 72 UTF-8 bytes",
    ),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const verifyEmailSchema = z.strictObject({
  token: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]{43}$/,
      "Invalid verification token",
    ),
});

export const sessionParamsSchema = z.strictObject({
  sessionId: z.string().uuid("Invalid session ID"),
});
