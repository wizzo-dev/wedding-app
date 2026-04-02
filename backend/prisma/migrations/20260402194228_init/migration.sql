-- CreateTable
CREATE TABLE "users" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "allocated_percent" REAL NOT NULL,
    "allocated_amount" REAL NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "group_name" TEXT,
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

-- CreateTable
CREATE TABLE "wa_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "session_data_encrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "phone_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active" DATETIME,
    CONSTRAINT "wa_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wa_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wa_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wa_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "template_id" INTEGER,
    "recipient_ids" TEXT NOT NULL,
    "scheduled_at" DATETIME,
    "sent_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wa_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wa_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "wa_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_layouts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'האולם שלי',
    "width" INTEGER NOT NULL DEFAULT 1200,
    "height" INTEGER NOT NULL DEFAULT 800,
    "bg_color" TEXT NOT NULL DEFAULT '#f9f5f0',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hall_layouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "layout_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'round',
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 8,
    "name" TEXT,
    "rotation" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tables_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "hall_layouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "table_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "table_id" INTEGER NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "seat_number" INTEGER,
    CONSTRAINT "table_assignments_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "table_assignments_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hall_elements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "layout_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "label" TEXT,
    "rotation" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "hall_elements_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "hall_layouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "design_json" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "preview_url" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_exports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "card_exports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "card_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "price_range" TEXT,
    "rating" REAL,
    "city" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "user_vendors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'considering',
    "price_agreed" REAL,
    "notes" TEXT,
    "contract_url" TEXT,
    CONSTRAINT "user_vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "starts_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" DATETIME,
    "payment_ref" TEXT,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rsvp_token_key" ON "users"("rsvp_token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "guests_guest_token_key" ON "guests"("guest_token");

-- CreateIndex
CREATE UNIQUE INDEX "wa_sessions_user_id_key" ON "wa_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "table_assignments_table_id_guest_id_key" ON "table_assignments"("table_id", "guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");
