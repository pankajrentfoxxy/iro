-- CreateTable
CREATE TABLE "HomepageStatsOverride" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "totalReformers" INTEGER,
    "states" INTEGER,
    "districts" INTEGER,
    "growthPercent" DECIMAL(5,2),
    "useOverride" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageStatsOverride_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "HomepageStatsOverride" ("id", "useOverride") VALUES (1, false);
