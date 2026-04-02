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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "email_verified", "id", "name1", "name2", "password_hash", "plan", "profile_image_url", "rsvp_token", "updated_at", "venue", "venue_address", "wedding_date") SELECT "created_at", "email", "email_verified", "id", "name1", "name2", "password_hash", "plan", "profile_image_url", "rsvp_token", "updated_at", "venue", "venue_address", "wedding_date" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_rsvp_token_key" ON "users"("rsvp_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
