-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "squareAccessToken" TEXT,
ADD COLUMN     "squareRefreshToken" TEXT,
ADD COLUMN     "squareTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReceiptUpload" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "date" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceiptUpload_teamId_idx" ON "ReceiptUpload"("teamId");

-- CreateIndex
CREATE INDEX "ReceiptUpload_uploadedBy_idx" ON "ReceiptUpload"("uploadedBy");

-- AddForeignKey
ALTER TABLE "ReceiptUpload" ADD CONSTRAINT "ReceiptUpload_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
