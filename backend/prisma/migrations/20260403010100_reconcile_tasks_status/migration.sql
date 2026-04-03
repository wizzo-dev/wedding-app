-- RecreateTable: tasks — reconcile done Boolean → status String, add missing columns
-- SQLite requires table recreation for column type changes

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_tasks" (
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
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_tasks" ("id", "user_id", "title", "due_date", "priority", "status", "created_at", "updated_at")
SELECT "id", "user_id", "title", "due_date", "priority",
  CASE WHEN "done" = 1 THEN 'done' ELSE 'todo' END,
  "created_at", "updated_at"
FROM "tasks";

DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
