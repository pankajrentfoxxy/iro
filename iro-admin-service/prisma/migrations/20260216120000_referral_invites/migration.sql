-- Hierarchical referral invites (role fixed server-side)

CREATE TABLE "referral_invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_for_role_id" TEXT NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_invites_code_key" ON "referral_invites"("code");
CREATE INDEX "referral_invites_created_by_user_id_idx" ON "referral_invites"("created_by_user_id");
CREATE INDEX "referral_invites_created_for_role_id_idx" ON "referral_invites"("created_for_role_id");

ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_created_for_role_id_fkey" FOREIGN KEY ("created_for_role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_invite_used_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_referral_invite_used_id_fkey" FOREIGN KEY ("referral_invite_used_id") REFERENCES "referral_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "users_referral_invite_used_id_idx" ON "users"("referral_invite_used_id");
