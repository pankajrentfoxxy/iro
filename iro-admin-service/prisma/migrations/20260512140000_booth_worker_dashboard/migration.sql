-- Booth worker dashboard: booth_details + task due dates

CREATE TABLE "booth_details" (
    "id" TEXT NOT NULL,
    "booth_location_id" TEXT NOT NULL,
    "booth_number" TEXT,
    "registered_voters" INTEGER NOT NULL DEFAULT 900,
    "last_mood_sentiment" "SurveySentiment",
    "last_mood_note" TEXT,
    "last_mood_at" TIMESTAMP(3),
    "last_mood_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booth_details_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booth_details_booth_location_id_key" ON "booth_details"("booth_location_id");

ALTER TABLE "booth_details" ADD CONSTRAINT "booth_details_booth_location_id_fkey" FOREIGN KEY ("booth_location_id") REFERENCES "hierarchy_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD COLUMN "due_date" TIMESTAMP(3);

CREATE INDEX "tasks_assigned_to_id_due_date_idx" ON "tasks"("assigned_to", "due_date");
