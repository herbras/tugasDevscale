/*
  Warnings:

  - Made the column `privilegeGroup` on table `privilege` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_privilege" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "privilegeName" TEXT NOT NULL,
    "description" TEXT,
    "privilegeGroup" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_privilege" ("createdAt", "deletedAt", "description", "id", "privilegeGroup", "privilegeName", "updatedAt") SELECT "createdAt", "deletedAt", "description", "id", "privilegeGroup", "privilegeName", "updatedAt" FROM "privilege";
DROP TABLE "privilege";
ALTER TABLE "new_privilege" RENAME TO "privilege";
CREATE UNIQUE INDEX "privilege_privilegeName_key" ON "privilege"("privilegeName");
CREATE INDEX "privilege_privilegeName_idx" ON "privilege"("privilegeName");
CREATE INDEX "privilege_privilegeGroup_idx" ON "privilege"("privilegeGroup");
CREATE TABLE "new_role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_role" ("createdAt", "deletedAt", "description", "id", "name", "roleType", "updatedAt") SELECT "createdAt", "deletedAt", "description", "id", "name", "roleType", "updatedAt" FROM "role";
DROP TABLE "role";
ALTER TABLE "new_role" RENAME TO "role";
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");
CREATE INDEX "role_name_idx" ON "role"("name");
CREATE INDEX "role_roleType_idx" ON "role"("roleType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
