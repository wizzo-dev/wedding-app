-- AlterTable
ALTER TABLE "wa_messages" ADD COLUMN "message" TEXT;
ALTER TABLE "wa_messages" ADD COLUMN "results" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "category" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name1" TEXT NOT NULL,
    "name2" TEXT NOT NULL,
    "wedding_date" DATETIME,
    "venue" TEXT,
    "venue_address" TEXT,
    "profile_image_url" TEXT,
    "rsvp_token" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "total_budget" REAL NOT NULL DEFAULT 0,
    "selected_card_template_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "email_verified", "id", "name1", "name2", "password_hash", "plan", "profile_image_url", "rsvp_token", "updated_at", "venue", "venue_address", "wedding_date") SELECT "created_at", "email", "email_verified", "id", "name1", "name2", "password_hash", "plan", "profile_image_url", "rsvp_token", "updated_at", "venue", "venue_address", "wedding_date" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_rsvp_token_key" ON "users"("rsvp_token");
CREATE TABLE "new_wa_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wa_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wa_templates" ("content", "created_at", "id", "is_default", "name", "user_id", "variables") SELECT "content", "created_at", "id", "is_default", "name", "user_id", "variables" FROM "wa_templates";
DROP TABLE "wa_templates";
ALTER TABLE "new_wa_templates" RENAME TO "wa_templates";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
