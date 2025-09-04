-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sales_person" (
    "sales_person_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL,
    "is_manager" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_sales_person" ("created_at", "department", "email", "is_manager", "name", "sales_person_id", "updated_at") SELECT "created_at", "department", "email", "is_manager", "name", "sales_person_id", "updated_at" FROM "sales_person";
DROP TABLE "sales_person";
ALTER TABLE "new_sales_person" RENAME TO "sales_person";
CREATE UNIQUE INDEX "sales_person_email_key" ON "sales_person"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
