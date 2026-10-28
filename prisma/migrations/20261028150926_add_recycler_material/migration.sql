-- CreateTable
CREATE TABLE "RecyclerMaterial" (
    "recyclerId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecyclerMaterial_pkey" PRIMARY KEY ("recyclerId","materialId")
);

-- CreateIndex
CREATE INDEX "RecyclerMaterial_materialId_idx" ON "RecyclerMaterial"("materialId");

-- AddForeignKey
ALTER TABLE "RecyclerMaterial" ADD CONSTRAINT "RecyclerMaterial_recyclerId_fkey" FOREIGN KEY ("recyclerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecyclerMaterial" ADD CONSTRAINT "RecyclerMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
