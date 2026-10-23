import type { Prisma } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { encryptEmailPayload, emailPayloadSchema } from "./email.payload.js";

type CreateEmailData = {
  to: string;
  subject: string;
  text: string;
  expiresAt: Date;
};

export class EmailRepository {
  create(data: CreateEmailData, tx: Prisma.TransactionClient) {
    const lifetimeMs = data.expiresAt.getTime() - Date.now();

    if (
      !Number.isFinite(lifetimeMs) ||
      lifetimeMs <= 0 ||
      lifetimeMs > 24 * 60 * 60 * 1000
    ) {
      throw new Error("Authentication email expiry must be within 24 hours");
    }

    const payload = emailPayloadSchema.parse({
      from: env.EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      text: data.text,
    });

    return tx.emailOutbox.create({
      data: {
        encryptedPayload: encryptEmailPayload(payload),
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
      },
    });
  }
}
