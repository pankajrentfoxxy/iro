-- CreateTable
CREATE TABLE "LatestUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatestUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LatestUpdate_publishedAt_idx" ON "LatestUpdate"("publishedAt");
