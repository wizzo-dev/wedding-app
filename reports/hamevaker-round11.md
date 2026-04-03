# המבקר — Round 11 Verification Report

**Date:** 2026-04-03  
**Reviewer:** Hamevaker (המבקר)  
**Scope:** Two patched branches before 4-branch merge to main

---

## 1. `feat/page/notifications` — Migration State Verification

### prisma migrate status
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"
8 migrations found in prisma/migrations
Database schema is up to date!
```
✅ **"Database schema is up to date!"** — zero unapplied migrations.

### Migration files in `prisma/migrations/`
```
20260402194228_init
20260402204555_add_guest_side
20260402205126_add_guest_side
20260403003740_add_tasks
20260403010000_add_guest_rsvp_fields
20260403010100_reconcile_tasks_status
20260403020000_add_gift_wish          ← PRESENT
20260403030000_add_notifications      ← PRESENT
```
✅ Both `20260403020000_add_gift_wish` and `20260403030000_add_notifications` exist on disk.

### _prisma_migrations DB rows
| migration_name | applied_steps_count | finished_at | rolled_back_at |
|---|---|---|---|
| 20260403020000_add_gift_wish | 0 | 2026-04-03T02:27:55Z | null |
| 20260403030000_add_notifications | 0 | 2026-04-03T02:27:56Z | null |

✅ Both present with `finished_at` set and `rolled_back_at` null — Prisma considers them applied.

⚠️ **NOTE — `applied_steps_count = 0` on both:**  
These were resolved via `prisma migrate resolve --applied` (baselining), meaning Prisma marked them applied without executing the SQL itself. This is the approach taken in commit `2cddb3f`. The fix works because:
- Both tables (`gift_wishes`, `notifications`) **actually exist** in the DB with the correct schema (verified via `PRAGMA table_info`)
- The resolve method is the standard Prisma recovery path for this situation
- On a **fresh production deploy**, `prisma migrate deploy` starts from an empty `_prisma_migrations` table and would run the SQL from the migration files normally — no issue there

**Risk level:** LOW / Informational only. The dev DB is consistent; production deploys are unaffected.

### SQL vs schema.prisma — Notification model

**migration SQL (`20260403030000_add_notifications/migration.sql`):**
```sql
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

**schema.prisma Notification model:**
```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  type      String   @default("system")
  title     String
  body      String
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("notifications")
}
```

**Column-by-column match:**
| Column | SQL | Schema | Match |
|---|---|---|---|
| id | INTEGER PK AUTOINCREMENT | Int @id @default(autoincrement()) | ✅ |
| user_id | INTEGER NOT NULL | Int @map("user_id") | ✅ |
| type | TEXT NOT NULL DEFAULT 'system' | String @default("system") | ✅ |
| title | TEXT NOT NULL | String | ✅ |
| body | TEXT NOT NULL | String | ✅ |
| is_read | BOOLEAN NOT NULL DEFAULT false | Boolean @default(false) @map("is_read") | ✅ |
| created_at | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | DateTime @default(now()) @map("created_at") | ✅ |
| FK | user_id → users.id CASCADE | onDelete: Cascade | ✅ |
| table name | "notifications" | @@map("notifications") | ✅ |

✅ **Perfect match — SQL and schema are in full alignment.**

---

## 2. `feat/page/vendor-suggestions` — Transaction Verification

**File:** `backend/src/routes/vendorSuggestions.js`  
**Route:** `POST /suggestions/add` (mounted under `/api/vendors`)

### Transaction implementation

```js
const { vendor, userVendor } = await prisma.$transaction(async (tx) => {
  const vendor = await tx.vendor.create({
    data: {
      category: category.trim(),
      name: name.trim(),
      description: notes ? notes.trim() : null,
    }
  })

  const userVendor = await tx.userVendor.create({
    data: {
      userId,
      vendorId: vendor.id,   // ← depends on vendor.id from first create
      status: 'considering',
      notes: notes ? notes.trim() : null,
    }
  })

  return { vendor, userVendor }
})
```

**Verification checklist:**

| Check | Result |
|---|---|
| Uses `prisma.$transaction(async (tx) => {...})` (interactive form) | ✅ |
| `vendor.create` uses `tx.vendor.create` (not `prisma.vendor.create`) | ✅ |
| `userVendor.create` uses `tx.userVendor.create` (not `prisma.userVendor.create`) | ✅ |
| `userVendor.create` uses `vendor.id` from first create (sequential dependency) | ✅ |
| If `userVendor.create` throws → transaction rolls back → `vendor.create` undone | ✅ |
| No orphan Vendor rows possible | ✅ |

✅ **Transaction is correctly implemented using the interactive (async callback) form.**  
✅ **Zero orphan-row risk.** Both creates are atomic.

---

## 3. Sanity Check — Previously Approved Branches

### `feat/page/profile`
- Last commit: `5b0f4d0` — `fix(profile): add backend validation on PATCH /api/users/profile`  
- Committed at: `2026-04-03 02:20:13 UTC`  
- No commits after the round 10 fix  
✅ **Untouched since approval.**

### `feat/page/payment-stubs`
- Last commit: `78013b5` — `fix(payment-stubs): remove console.log of userId+plan from upgrade stub route`  
- Committed at: `2026-04-03 02:20:38 UTC`  
- No commits after the round 10 fix  
✅ **Untouched since approval.**

---

## Summary

| Branch | Check | Result |
|---|---|---|
| feat/page/notifications | `prisma migrate status` — up to date | ✅ |
| feat/page/notifications | Both migrations present & applied | ✅ |
| feat/page/notifications | SQL matches Notification model | ✅ |
| feat/page/notifications | `applied_steps_count = 0` (resolved, not run) | ⚠️ LOW — informational, tables exist |
| feat/page/vendor-suggestions | `POST /api/vendors/suggestions/add` found | ✅ |
| feat/page/vendor-suggestions | Both creates in `prisma.$transaction(async tx)` | ✅ |
| feat/page/vendor-suggestions | No orphan-row risk | ✅ |
| feat/page/profile | Untouched since round 10 | ✅ |
| feat/page/payment-stubs | Untouched since round 10 | ✅ |

---

## VERDICT: APPROVED
