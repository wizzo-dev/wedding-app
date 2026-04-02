-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_budget_expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_budget_expenses" ("amount", "category_id", "created_at", "date", "id", "note", "user_id", "vendor_name") SELECT "amount", "category_id", "created_at", "date", "id", "note", "user_id", "vendor_name" FROM "budget_expenses";
DROP TABLE "budget_expenses";
ALTER TABLE "new_budget_expenses" RENAME TO "budget_expenses";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
