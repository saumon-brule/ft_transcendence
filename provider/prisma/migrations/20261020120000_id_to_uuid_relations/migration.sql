-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_defaultRoleId_fkey";

-- DropForeignKey
ALTER TABLE "AccessRequest" DROP CONSTRAINT "AccessRequest_decidedById_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_revokedById_fkey";

-- DropForeignKey
ALTER TABLE "MemberRole" DROP CONSTRAINT "MemberRole_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberRole" DROP CONSTRAINT "MemberRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_addedById_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Music" DROP CONSTRAINT "Music_addedById_fkey";

-- DropForeignKey
ALTER TABLE "Music" DROP CONSTRAINT "Music_albumId_fkey";

-- DropForeignKey
ALTER TABLE "MusicArtist" DROP CONSTRAINT "MusicArtist_musicId_fkey";

-- DropForeignKey
ALTER TABLE "MusicArtist" DROP CONSTRAINT "MusicArtist_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Artist" DROP CONSTRAINT "Artist_addedById_fkey";

-- DropForeignKey
ALTER TABLE "AlbumArtist" DROP CONSTRAINT "AlbumArtist_albumId_fkey";

-- DropForeignKey
ALTER TABLE "AlbumArtist" DROP CONSTRAINT "AlbumArtist_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_addedById_fkey";

-- DropIndex
DROP INDEX "Provider_ownerId_key";

-- DropIndex
DROP INDEX "Provider_defaultRoleId_key";

-- DropIndex
DROP INDEX "AccessRequest_decidedById_idx";

-- DropIndex
DROP INDEX "Member_revokedById_idx";

-- DropIndex
DROP INDEX "MemberRole_roleId_memberId_idx";

-- DropIndex
DROP INDEX "MemberRole_memberId_roleId_key";

-- DropIndex
DROP INDEX "Role_addedById_idx";

-- DropIndex
DROP INDEX "RolePermission_permission_roleId_idx";

-- DropIndex
DROP INDEX "RolePermission_roleId_permission_key";

-- DropIndex
DROP INDEX "Music_addedById_idx";

-- DropIndex
DROP INDEX "Music_albumId_idx";

-- DropIndex
DROP INDEX "MusicArtist_artistId_musicId_idx";

-- DropIndex
DROP INDEX "MusicArtist_musicId_artistId_key";

-- DropIndex
DROP INDEX "Artist_addedById_idx";

-- DropIndex
DROP INDEX "AlbumArtist_artistId_albumId_idx";

-- DropIndex
DROP INDEX "AlbumArtist_albumId_artistId_key";

-- DropIndex
DROP INDEX "Album_addedById_idx";

-- AddColumn (nullable first, so existing rows can be backfilled)
ALTER TABLE "Provider" ADD COLUMN "ownerUuid" TEXT,
ADD COLUMN "defaultRoleUuid" TEXT;
ALTER TABLE "AccessRequest" ADD COLUMN "decidedByUuid" TEXT;
ALTER TABLE "Member" ADD COLUMN "revokedByUuid" TEXT;
ALTER TABLE "MemberRole" ADD COLUMN "memberUuid" TEXT,
ADD COLUMN "roleUuid" TEXT;
ALTER TABLE "Role" ADD COLUMN "addedByUuid" TEXT;
ALTER TABLE "RolePermission" ADD COLUMN "roleUuid" TEXT;
ALTER TABLE "Music" ADD COLUMN "addedByUuid" TEXT,
ADD COLUMN "albumUuid" TEXT;
ALTER TABLE "MusicArtist" ADD COLUMN "musicUuid" TEXT,
ADD COLUMN "artistUuid" TEXT;
ALTER TABLE "Artist" ADD COLUMN "addedByUuid" TEXT;
ALTER TABLE "AlbumArtist" ADD COLUMN "albumUuid" TEXT,
ADD COLUMN "artistUuid" TEXT;
ALTER TABLE "Album" ADD COLUMN "addedByUuid" TEXT;

-- Backfill uuid columns from the old id relations
UPDATE "Provider" AS t SET "ownerUuid" = r."uuid" FROM "Member" AS r WHERE t."ownerId" = r."id";
UPDATE "Provider" AS t SET "defaultRoleUuid" = r."uuid" FROM "Role" AS r WHERE t."defaultRoleId" = r."id";
UPDATE "AccessRequest" AS t SET "decidedByUuid" = r."uuid" FROM "Member" AS r WHERE t."decidedById" = r."id";
UPDATE "Member" AS t SET "revokedByUuid" = r."uuid" FROM "Member" AS r WHERE t."revokedById" = r."id";
UPDATE "MemberRole" AS t SET "memberUuid" = r."uuid" FROM "Member" AS r WHERE t."memberId" = r."id";
UPDATE "MemberRole" AS t SET "roleUuid" = r."uuid" FROM "Role" AS r WHERE t."roleId" = r."id";
UPDATE "Role" AS t SET "addedByUuid" = r."uuid" FROM "Member" AS r WHERE t."addedById" = r."id";
UPDATE "RolePermission" AS t SET "roleUuid" = r."uuid" FROM "Role" AS r WHERE t."roleId" = r."id";
UPDATE "Music" AS t SET "addedByUuid" = r."uuid" FROM "Member" AS r WHERE t."addedById" = r."id";
UPDATE "Music" AS t SET "albumUuid" = r."uuid" FROM "Album" AS r WHERE t."albumId" = r."id";
UPDATE "MusicArtist" AS t SET "musicUuid" = r."uuid" FROM "Music" AS r WHERE t."musicId" = r."id";
UPDATE "MusicArtist" AS t SET "artistUuid" = r."uuid" FROM "Artist" AS r WHERE t."artistId" = r."id";
UPDATE "Artist" AS t SET "addedByUuid" = r."uuid" FROM "Member" AS r WHERE t."addedById" = r."id";
UPDATE "AlbumArtist" AS t SET "albumUuid" = r."uuid" FROM "Album" AS r WHERE t."albumId" = r."id";
UPDATE "AlbumArtist" AS t SET "artistUuid" = r."uuid" FROM "Artist" AS r WHERE t."artistId" = r."id";
UPDATE "Album" AS t SET "addedByUuid" = r."uuid" FROM "Member" AS r WHERE t."addedById" = r."id";

-- Enforce NOT NULL on required relations
ALTER TABLE "Provider" ALTER COLUMN "ownerUuid" SET NOT NULL;
ALTER TABLE "MemberRole" ALTER COLUMN "memberUuid" SET NOT NULL,
ALTER COLUMN "roleUuid" SET NOT NULL;
ALTER TABLE "RolePermission" ALTER COLUMN "roleUuid" SET NOT NULL;
ALTER TABLE "MusicArtist" ALTER COLUMN "musicUuid" SET NOT NULL,
ALTER COLUMN "artistUuid" SET NOT NULL;
ALTER TABLE "AlbumArtist" ALTER COLUMN "albumUuid" SET NOT NULL,
ALTER COLUMN "artistUuid" SET NOT NULL;

-- DropColumn (old id relations)
ALTER TABLE "Provider" DROP COLUMN "ownerId",
DROP COLUMN "defaultRoleId";
ALTER TABLE "AccessRequest" DROP COLUMN "decidedById";
ALTER TABLE "Member" DROP COLUMN "revokedById";
ALTER TABLE "MemberRole" DROP COLUMN "memberId",
DROP COLUMN "roleId";
ALTER TABLE "Role" DROP COLUMN "addedById";
ALTER TABLE "RolePermission" DROP COLUMN "roleId";
ALTER TABLE "Music" DROP COLUMN "addedById",
DROP COLUMN "albumId";
ALTER TABLE "MusicArtist" DROP COLUMN "musicId",
DROP COLUMN "artistId";
ALTER TABLE "Artist" DROP COLUMN "addedById";
ALTER TABLE "AlbumArtist" DROP COLUMN "albumId",
DROP COLUMN "artistId";
ALTER TABLE "Album" DROP COLUMN "addedById";

-- CreateIndex
CREATE UNIQUE INDEX "Provider_ownerUuid_key" ON "Provider"("ownerUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_defaultRoleUuid_key" ON "Provider"("defaultRoleUuid");

-- CreateIndex
CREATE INDEX "AccessRequest_decidedByUuid_idx" ON "AccessRequest"("decidedByUuid");

-- CreateIndex
CREATE INDEX "Member_revokedByUuid_idx" ON "Member"("revokedByUuid");

-- CreateIndex
CREATE INDEX "MemberRole_roleUuid_memberUuid_idx" ON "MemberRole"("roleUuid", "memberUuid");

-- CreateIndex
CREATE UNIQUE INDEX "MemberRole_memberUuid_roleUuid_key" ON "MemberRole"("memberUuid", "roleUuid");

-- CreateIndex
CREATE INDEX "Role_addedByUuid_idx" ON "Role"("addedByUuid");

-- CreateIndex
CREATE INDEX "RolePermission_permission_roleUuid_idx" ON "RolePermission"("permission", "roleUuid");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleUuid_permission_key" ON "RolePermission"("roleUuid", "permission");

-- CreateIndex
CREATE INDEX "Music_addedByUuid_idx" ON "Music"("addedByUuid");

-- CreateIndex
CREATE INDEX "Music_albumUuid_idx" ON "Music"("albumUuid");

-- CreateIndex
CREATE INDEX "MusicArtist_artistUuid_musicUuid_idx" ON "MusicArtist"("artistUuid", "musicUuid");

-- CreateIndex
CREATE UNIQUE INDEX "MusicArtist_musicUuid_artistUuid_key" ON "MusicArtist"("musicUuid", "artistUuid");

-- CreateIndex
CREATE INDEX "Artist_addedByUuid_idx" ON "Artist"("addedByUuid");

-- CreateIndex
CREATE INDEX "AlbumArtist_artistUuid_albumUuid_idx" ON "AlbumArtist"("artistUuid", "albumUuid");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumArtist_albumUuid_artistUuid_key" ON "AlbumArtist"("albumUuid", "artistUuid");

-- CreateIndex
CREATE INDEX "Album_addedByUuid_idx" ON "Album"("addedByUuid");

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_ownerUuid_fkey" FOREIGN KEY ("ownerUuid") REFERENCES "Member"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_defaultRoleUuid_fkey" FOREIGN KEY ("defaultRoleUuid") REFERENCES "Role"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_decidedByUuid_fkey" FOREIGN KEY ("decidedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_revokedByUuid_fkey" FOREIGN KEY ("revokedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRole" ADD CONSTRAINT "MemberRole_memberUuid_fkey" FOREIGN KEY ("memberUuid") REFERENCES "Member"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRole" ADD CONSTRAINT "MemberRole_roleUuid_fkey" FOREIGN KEY ("roleUuid") REFERENCES "Role"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_addedByUuid_fkey" FOREIGN KEY ("addedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleUuid_fkey" FOREIGN KEY ("roleUuid") REFERENCES "Role"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_addedByUuid_fkey" FOREIGN KEY ("addedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_albumUuid_fkey" FOREIGN KEY ("albumUuid") REFERENCES "Album"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicArtist" ADD CONSTRAINT "MusicArtist_musicUuid_fkey" FOREIGN KEY ("musicUuid") REFERENCES "Music"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicArtist" ADD CONSTRAINT "MusicArtist_artistUuid_fkey" FOREIGN KEY ("artistUuid") REFERENCES "Artist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_addedByUuid_fkey" FOREIGN KEY ("addedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtist" ADD CONSTRAINT "AlbumArtist_albumUuid_fkey" FOREIGN KEY ("albumUuid") REFERENCES "Album"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtist" ADD CONSTRAINT "AlbumArtist_artistUuid_fkey" FOREIGN KEY ("artistUuid") REFERENCES "Artist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_addedByUuid_fkey" FOREIGN KEY ("addedByUuid") REFERENCES "Member"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

