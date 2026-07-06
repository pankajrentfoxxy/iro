-- Admin campaigns (leadership broadcasts / targeting)

CREATE TYPE "AdminCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED');

CREATE TABLE "admin_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AdminCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "target_role_level" TEXT,
    "scope_state_id" TEXT,
    "scope_district_id" TEXT,
    "scope_block_id" TEXT,
    "metadata" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admin_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_campaigns_created_by_id_idx" ON "admin_campaigns"("created_by_id");
CREATE INDEX "admin_campaigns_status_idx" ON "admin_campaigns"("status");
CREATE INDEX "admin_campaigns_deleted_at_idx" ON "admin_campaigns"("deleted_at");
CREATE INDEX "admin_campaigns_starts_at_idx" ON "admin_campaigns"("starts_at");

ALTER TABLE "admin_campaigns" ADD CONSTRAINT "admin_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
