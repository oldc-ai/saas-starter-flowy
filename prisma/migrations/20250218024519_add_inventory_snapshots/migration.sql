-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventorySnapshot_teamId_idx" ON "InventorySnapshot"("teamId");

-- CreateIndex
CREATE INDEX "InventorySnapshot_inventoryItemId_idx" ON "InventorySnapshot"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventorySnapshot_snapshotDate_idx" ON "InventorySnapshot"("snapshotDate");

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
