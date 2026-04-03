-- AlterTable: add meal_pref and rsvp_message columns to guests
ALTER TABLE "guests" ADD COLUMN "meal_pref" TEXT;
ALTER TABLE "guests" ADD COLUMN "rsvp_message" TEXT;
