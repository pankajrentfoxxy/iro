-- IRO - Reset Schema (run this FIRST if you get errors from a previous partial run)
-- Run while connected to "iro" database
-- This drops all tables and types so you can run 02_create_schema.sql cleanly

-- Drop foreign keys and tables (order matters - drop dependent tables first)
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

-- Drop enums
DROP TYPE IF EXISTS "SignupSource" CASCADE;
DROP TYPE IF EXISTS "CampaignLogStatus" CASCADE;
DROP TYPE IF EXISTS "CampaignType" CASCADE;
DROP TYPE IF EXISTS "ConsentStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
