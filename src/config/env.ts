import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  RESEND_API_KEY: z.string().startsWith("re_"),

  EMAIL_FROM: z.string().min(1),

  EMAIL_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[a-f0-9]{64}$/i,
      "EMAIL_ENCRYPTION_KEY must contain 64 hexadecimal characters",
    ),

  VERIFY_EMAIL_URL: z
    .string()
    .url()
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "VERIFY_EMAIL_URL must use HTTP or HTTPS",
    ),

  PASSWORD_RESET_SECRET: z
    .string()
    .regex(
      /^[a-fA-F0-9]{64}$/,
      "PASSWORD_RESET_SECRET must contain exactly 64 hexadecimal characters",
    ),

  JWT_SECRET: z
    .string()
    .regex(
      /^[a-f0-9]{64}$/i,
      "JWT_SECRET must contain 64 hexadecimal characters",
    ),

  JWT_ISSUER: z.string().min(1),

  JWT_AUDIENCE: z.string().min(1),

  CLIENT_ORIGIN: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);

      return (
        ["http:", "https:"].includes(url.protocol) &&
        url.username === "" &&
        url.password === "" &&
        url.pathname === "/" &&
        url.search === "" &&
        url.hash === ""
      );
    }, "CLIENT_ORIGIN must be an HTTP or HTTPS origin without a path")
    .transform((value) => new URL(value).origin),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = result.data;
