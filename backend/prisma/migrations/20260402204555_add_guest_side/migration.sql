-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "group_name" TEXT,
    "side" TEXT NOT NULL DEFAULT 'חתן',
    "rsvp_status" TEXT NOT NULL DEFAULT 'pending',
    "num_people" INTEGER NOT NULL DEFAULT 1,
    "gift_amount" REAL,
    "notes" TEXT,
    "table_id" INTEGER,
    "guest_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "guests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guests_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_guests" ("created_at", "email", "gift_amount", "group_name", "guest_token", "id", "name", "notes", "num_people", "phone", "rsvp_status", "table_id", "updated_at", "user_id") SELECT "created_at", "email", "gift_amount", "group_name", "guest_token", "id", "name", "notes", "num_people", "phone", "rsvp_status", "table_id", "updated_at", "user_id" FROM "guests";
DROP TABLE "guests";
ALTER TABLE "new_guests" RENAME TO "guests";
CREATE UNIQUE INDEX "guests_guest_token_key" ON "guests"("guest_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
