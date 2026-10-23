import { createCipheriv, createDecipheriv,
  randomBytes,
} from "node:crypto";

import { z } from "zod";

import { env } from "../../config/env.js";

export const emailPayloadSchema = z.object({
  from: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
});

export type EmailPayload = z.infer<typeof emailPayloadSchema>;

const encryptionKey = Buffer.from(
  env.EMAIL_ENCRYPTION_KEY,
  "hex",
);

export function encryptEmailPayload(payload: EmailPayload): string {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  const authenticationTag = cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authenticationTag,
    encrypted,
  ]).toString("base64");
}

export function decryptEmailPayload(
  encryptedPayload: string,
): EmailPayload {
  const buffer = Buffer.from(encryptedPayload, "base64");

  const iv = buffer.subarray(0, 12);
  const authenticationTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    iv,
  );

  decipher.setAuthTag(authenticationTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");

  return emailPayloadSchema.parse(JSON.parse(decrypted));
}