-- IRO - Create Schema and Tables (ALL-IN-ONE)
-- Run this in pgAdmin or DBeaver while connected to the "iro" database
--
-- IMPORTANT: Execute the ENTIRE script at once
--   DBeaver: Ctrl+Alt+X (Execute Script) or select all + Ctrl+Enter
--   pgAdmin: F5 (Execute)
--
-- ============ STEP 1: RESET (drops existing objects) ============
DROP TABLE IF EXISTS "LatestUpdate" CASCADE;
DROP TABLE IF EXISTS "AdminActionLog" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "MissedCall" CASCADE;
DROP TABLE IF EXISTS "Donation" CASCADE;
DROP TABLE IF EXISTS "DeviceToken" CASCADE;
DROP TABLE IF EXISTS "PushNotification" CASCADE;
DROP TABLE IF EXISTS "BulkSmsQueue" CASCADE;
DROP TABLE IF EXISTS "CampaignLog" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "AnalyticsUserScore" CASCADE;
DROP TABLE IF EXISTS "IdeologyPreference" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "SignupSource" CASCADE;
DROP TYPE IF EXISTS "CampaignLogStatus" CASCADE;
DROP TYPE IF EXISTS "CampaignType" CASCADE;
DROP TYPE IF EXISTS "ConsentStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- ============ STEP 2: ENUMS ============
CREATE TYPE "Role" AS ENUM ('MEMBER', 'BOOTH_COORDINATOR', 'TEHSIL_ADMIN', 'DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN');
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED');
CREATE TYPE "CampaignType" AS ENUM ('SMS', 'WHATSAPP', 'PUSH', 'EVENT');
CREATE TYPE "CampaignLogStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE "SignupSource" AS ENUM ('MISSED_CALL', 'WHATSAPP', 'WEB', 'APP', 'REFERRAL');

-- ============ STEP 3: TABLES ============
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "email" TEXT,
    "state" TEXT,
    "district" TEXT,
    "tehsil" TEXT,
    "city" TEXT,
    "area" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "signupSource" "SignupSource",
    "ideologyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "consentTimestamp" TIMESTAMP(3),
    "passwordHash" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdeologyPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "interestLevel" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdeologyPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsUserScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "influenceScore" INTEGER NOT NULL DEFAULT 0,
    "donationScore" INTEGER NOT NULL DEFAULT 0,
    "ideologyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalyticsUserScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetState" TEXT,
    "targetDistrict" TEXT,
    "targetTehsil" TEXT,
    "campaignType" "CampaignType" NOT NULL,
    "messageContent" TEXT,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT,
    "status" "CampaignLogStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BulkSmsQueue" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BulkSmsQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetState" TEXT,
    "targetDistrict" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayId" TEXT,
    "razorpayOrderId" TEXT,
    "panNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissedCall" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissedCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "LatestUpdate_publishedAt_idx" ON "LatestUpdate"("publishedAt");

CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT,
    "targetId" TEXT,
    "jurisdiction" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- ============ STEP 4: INDEXES ============
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE UNIQUE INDEX "AnalyticsUserScore_userId_key" ON "AnalyticsUserScore"("userId");
CREATE UNIQUE INDEX "Donation_razorpayId_key" ON "Donation"("razorpayId");
CREATE INDEX "IdeologyPreference_userId_idx" ON "IdeologyPreference"("userId");
CREATE INDEX "IdeologyPreference_topic_idx" ON "IdeologyPreference"("topic");
CREATE INDEX "AnalyticsUserScore_engagementScore_idx" ON "AnalyticsUserScore"("engagementScore");
CREATE INDEX "AnalyticsUserScore_ideologyScore_idx" ON "AnalyticsUserScore"("ideologyScore");
CREATE INDEX "CampaignLog_campaignId_idx" ON "CampaignLog"("campaignId");
CREATE INDEX "CampaignLog_userId_idx" ON "CampaignLog"("userId");
CREATE INDEX "BulkSmsQueue_campaignId_idx" ON "BulkSmsQueue"("campaignId");
CREATE INDEX "BulkSmsQueue_status_idx" ON "BulkSmsQueue"("status");
CREATE INDEX "PushNotification_status_idx" ON "PushNotification"("status");
CREATE UNIQUE INDEX "DeviceToken_userId_token_key" ON "DeviceToken"("userId", "token");
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");
CREATE INDEX "Donation_status_idx" ON "Donation"("status");
CREATE INDEX "MissedCall_phone_idx" ON "MissedCall"("phone");
CREATE INDEX "MissedCall_createdAt_idx" ON "MissedCall"("createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AdminActionLog_adminId_idx" ON "AdminActionLog"("adminId");
CREATE INDEX "AdminActionLog_createdAt_idx" ON "AdminActionLog"("createdAt");

-- ============ STEP 5: FOREIGN KEYS ============
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdeologyPreference" ADD CONSTRAINT "IdeologyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsUserScore" ADD CONSTRAINT "AnalyticsUserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BulkSmsQueue" ADD CONSTRAINT "BulkSmsQueue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissedCall" ADD CONSTRAINT "MissedCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
