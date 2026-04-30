-- CreateEnum
CREATE TYPE "OrganisationRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "Organisation" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "postalCode" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrganisationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" "OrganisationRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganisationMember_userId_idx" ON "OrganisationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganisationMember_organisationId_idx" ON "OrganisationMember"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMember_userId_organisationId_key" ON "OrganisationMember"("userId", "organisationId");

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: copy existing memberships from join table; promote prior isAdmin users to OWNER
INSERT INTO "OrganisationMember" ("id", "userId", "organisationId", "role", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  j."B",
  j."A",
  CASE WHEN u."isAdmin" THEN 'OWNER'::"OrganisationRole" ELSE 'MEMBER'::"OrganisationRole" END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "_OrganisationToUser" j
JOIN "User" u ON u."id" = j."B";

-- DropForeignKey
ALTER TABLE "_OrganisationToUser" DROP CONSTRAINT "_OrganisationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrganisationToUser" DROP CONSTRAINT "_OrganisationToUser_B_fkey";

-- DropTable
DROP TABLE "_OrganisationToUser";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdmin";
