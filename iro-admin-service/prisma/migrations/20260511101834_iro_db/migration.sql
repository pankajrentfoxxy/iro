-- CreateEnum
CREATE TYPE "HierarchyType" AS ENUM ('COUNTRY', 'STATE', 'REGION', 'DISTRICT', 'BLOCK', 'BOOTH');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SurveySentiment" AS ENUM ('SUPPORTIVE', 'NEUTRAL', 'OPPOSITION');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ELECTION_STARTED', 'APPROVED', 'REJECTED', 'PROMOTED');

-- CreateEnum
CREATE TYPE "ElectionAreaType" AS ENUM ('STATE', 'DISTRICT', 'BLOCK', 'BOOTH');

-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "level_code" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hierarchy_locations" (
    "id" TEXT NOT NULL,
    "type" "HierarchyType" NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hierarchy_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_encrypted" TEXT NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "role_id" TEXT,
    "referral_code" TEXT NOT NULL,
    "referred_by" TEXT,
    "leadership_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "peer_rating_avg" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "network_size" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "surveys_submitted" INTEGER NOT NULL DEFAULT 0,
    "days_active" INTEGER NOT NULL DEFAULT 0,
    "profile_image" TEXT,
    "date_of_birth" DATE,
    "gender" TEXT,
    "village" TEXT,
    "pincode" TEXT,
    "occupation" TEXT,
    "education" TEXT,
    "state_label" TEXT,
    "district_label" TEXT,
    "block_label" TEXT,
    "state_id" TEXT,
    "district_id" TEXT,
    "block_id" TEXT,
    "booth_id" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "level_depth" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_by" TEXT,
    "assigned_to" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "gps_lat" DECIMAL(12,7),
    "gps_long" DECIMAL(12,7),
    "proof_image_url" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booth_id" TEXT,
    "voter_name" TEXT,
    "voter_mobile" TEXT,
    "sentiment" "SurveySentiment",
    "gps_lat" DECIMAL(12,7),
    "gps_long" DECIMAL(12,7),
    "client_submission_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_ratings" (
    "id" TEXT NOT NULL,
    "rated_user_id" TEXT NOT NULL,
    "rated_by_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leadership_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "direct_referral_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "network_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "task_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "survey_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active_days_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "peer_rating_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leadership_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_nominations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_role_id" TEXT,
    "nominated_role_id" TEXT,
    "nomination_reason" TEXT,
    "eligibility_score" DECIMAL(10,2),
    "status" "NominationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role_id" TEXT,
    "area_type" "ElectionAreaType" NOT NULL,
    "state_id" TEXT,
    "district_id" TEXT,
    "block_id" TEXT,
    "booth_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "ElectionStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_candidates" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leadership_score" DECIMAL(10,2),
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "final_rank" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "election_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_votes" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "voter_user_id" TEXT NOT NULL,
    "candidate_user_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "election_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_promotions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "previous_role_id" TEXT,
    "new_role_id" TEXT,
    "promoted_by" TEXT,
    "promotion_reason" TEXT,
    "election_id" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_level_code_idx" ON "roles"("level_code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_level_code_key" ON "roles"("level_code");

-- CreateIndex
CREATE INDEX "hierarchy_locations_type_idx" ON "hierarchy_locations"("type");

-- CreateIndex
CREATE INDEX "hierarchy_locations_parent_id_idx" ON "hierarchy_locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users"("phone_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_referred_by_idx" ON "users"("referred_by");

-- CreateIndex
CREATE INDEX "users_state_id_district_id_idx" ON "users"("state_id", "district_id");

-- CreateIndex
CREATE INDEX "referrals_referrer_user_id_idx" ON "referrals"("referrer_user_id");

-- CreateIndex
CREATE INDEX "referrals_referred_user_id_idx" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referrer_user_id_referred_user_id_key" ON "referrals"("referrer_user_id", "referred_user_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "tasks_assigned_by_idx" ON "tasks"("assigned_by");

-- CreateIndex
CREATE INDEX "surveys_user_id_idx" ON "surveys"("user_id");

-- CreateIndex
CREATE INDEX "surveys_booth_id_idx" ON "surveys"("booth_id");

-- CreateIndex
CREATE UNIQUE INDEX "surveys_user_id_client_submission_id_key" ON "surveys"("user_id", "client_submission_id");

-- CreateIndex
CREATE INDEX "peer_ratings_rated_user_id_idx" ON "peer_ratings"("rated_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "peer_ratings_rated_user_id_rated_by_user_id_key" ON "peer_ratings"("rated_user_id", "rated_by_user_id");

-- CreateIndex
CREATE INDEX "leadership_scores_user_id_calculated_at_idx" ON "leadership_scores"("user_id", "calculated_at" DESC);

-- CreateIndex
CREATE INDEX "role_nominations_user_id_status_idx" ON "role_nominations"("user_id", "status");

-- CreateIndex
CREATE INDEX "elections_status_idx" ON "elections"("status");

-- CreateIndex
CREATE INDEX "elections_state_id_district_id_idx" ON "elections"("state_id", "district_id");

-- CreateIndex
CREATE INDEX "election_candidates_election_id_idx" ON "election_candidates"("election_id");

-- CreateIndex
CREATE UNIQUE INDEX "election_candidates_election_id_user_id_key" ON "election_candidates"("election_id", "user_id");

-- CreateIndex
CREATE INDEX "election_votes_election_id_idx" ON "election_votes"("election_id");

-- CreateIndex
CREATE UNIQUE INDEX "election_votes_election_id_voter_user_id_key" ON "election_votes"("election_id", "voter_user_id");

-- CreateIndex
CREATE INDEX "role_promotions_user_id_idx" ON "role_promotions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_path_idx" ON "audit_logs"("path");

-- AddForeignKey
ALTER TABLE "hierarchy_locations" ADD CONSTRAINT "hierarchy_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_ratings" ADD CONSTRAINT "peer_ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_ratings" ADD CONSTRAINT "peer_ratings_rated_by_user_id_fkey" FOREIGN KEY ("rated_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leadership_scores" ADD CONSTRAINT "leadership_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_nominations" ADD CONSTRAINT "role_nominations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_nominations" ADD CONSTRAINT "role_nominations_current_role_id_fkey" FOREIGN KEY ("current_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_nominations" ADD CONSTRAINT "role_nominations_nominated_role_id_fkey" FOREIGN KEY ("nominated_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "hierarchy_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_candidates" ADD CONSTRAINT "election_candidates_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_candidates" ADD CONSTRAINT "election_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_previous_role_id_fkey" FOREIGN KEY ("previous_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_new_role_id_fkey" FOREIGN KEY ("new_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_promoted_by_fkey" FOREIGN KEY ("promoted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
