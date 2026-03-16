-- STEP 2b: Run this SECOND (after 02a_tables_only.sql succeeds)
-- Creates indexes and foreign keys

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
