-- AlterTable: add bank_info and bit_phone to users
ALTER TABLE "users" ADD COLUMN "bank_info" TEXT;
ALTER TABLE "users" ADD COLUMN "bit_phone" TEXT;

-- CreateTable: gift_wishes
CREATE TABLE "gift_wishes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "desired_amount" REAL NOT NULL,
    "message" TEXT,
    "image_url" TEXT,
    "is_contributed" BOOLEAN NOT NULL DEFAULT false,
    "contributed_by" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gift_wishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
