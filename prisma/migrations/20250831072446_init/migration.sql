-- CreateTable
CREATE TABLE "sales_person" (
    "sales_person_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "is_manager" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer" (
    "customer_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "daily_report" (
    "report_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sales_person_id" INTEGER NOT NULL,
    "report_date" DATETIME NOT NULL,
    "problem" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_report_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "sales_person" ("sales_person_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visit_record" (
    "visit_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "report_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "visit_content" TEXT NOT NULL,
    "visit_time" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visit_record_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_report" ("report_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visit_record_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manager_comment" (
    "comment_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "report_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manager_comment_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_report" ("report_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manager_comment_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "sales_person" ("sales_person_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_person_email_key" ON "sales_person"("email");

-- CreateIndex
CREATE INDEX "daily_report_report_date_idx" ON "daily_report"("report_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_sales_person_id_report_date_key" ON "daily_report"("sales_person_id", "report_date");

-- CreateIndex
CREATE INDEX "visit_record_report_id_idx" ON "visit_record"("report_id");

-- CreateIndex
CREATE INDEX "visit_record_customer_id_idx" ON "visit_record"("customer_id");

-- CreateIndex
CREATE INDEX "manager_comment_report_id_idx" ON "manager_comment"("report_id");

-- CreateIndex
CREATE INDEX "manager_comment_manager_id_idx" ON "manager_comment"("manager_id");
