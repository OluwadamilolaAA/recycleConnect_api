-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" UUID NOT NULL,
    "encryptedPayload" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailOutbox_sentAt_expiresAt_idx" ON "EmailOutbox"("sentAt", "expiresAt");
