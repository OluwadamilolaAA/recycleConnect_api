-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'CLAIMED', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "collectorId" UUID,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "street" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "landmark" VARCHAR(255),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupItem" (
    "id" UUID NOT NULL,
    "pickupRequestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "materialName" VARCHAR(100) NOT NULL,
    "estimatedWeightKg" DECIMAL(10,3),

    CONSTRAINT "PickupItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PickupRequest_householdId_createdAt_idx" ON "PickupRequest"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupRequest_collectorId_createdAt_idx" ON "PickupRequest"("collectorId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupRequest_status_createdAt_idx" ON "PickupRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PickupItem_materialId_idx" ON "PickupItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PickupItem_pickupRequestId_materialId_key" ON "PickupItem"("pickupRequestId", "materialId");

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupItem" ADD CONSTRAINT "PickupItem_pickupRequestId_fkey" FOREIGN KEY ("pickupRequestId") REFERENCES "PickupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupItem" ADD CONSTRAINT "PickupItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
