-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_currentlyListeningId_fkey";

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ProviderUser" DROP CONSTRAINT "ProviderUser_providerId_fkey";

-- DropForeignKey
ALTER TABLE "ProviderUser" DROP CONSTRAINT "ProviderUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlaylist" DROP CONSTRAINT "UserPlaylist_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlaylist" DROP CONSTRAINT "UserPlaylist_playlistId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistMusic" DROP CONSTRAINT "PlaylistMusic_playlistId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistMusic" DROP CONSTRAINT "PlaylistMusic_musicId_fkey";

-- DropIndex
DROP INDEX "FriendRequest_user_id_friend_id_key";

-- DropIndex
DROP INDEX "UserRole_userId_roleId_key";

-- DropIndex
DROP INDEX "ProviderUser_providerId_userId_key";

-- DropIndex
DROP INDEX "UserPlaylist_userId_playlistId_key";

-- AddColumn (nullable first, so existing rows can be backfilled)
ALTER TABLE "User" ADD COLUMN "currentlyListeningUUID" TEXT;
ALTER TABLE "FriendRequest" ADD COLUMN "user_uuid" TEXT,
ADD COLUMN "friend_uuid" TEXT;
ALTER TABLE "Token" ADD COLUMN "userUUID" TEXT;
ALTER TABLE "UserRole" ADD COLUMN "userUUID" TEXT;
ALTER TABLE "Provider" ADD COLUMN "ownerUUID" TEXT;
ALTER TABLE "ProviderUser" ADD COLUMN "providerUUID" TEXT,
ADD COLUMN "userUUID" TEXT;
ALTER TABLE "Playlist" ADD COLUMN "ownerUUID" TEXT;
ALTER TABLE "UserPlaylist" ADD COLUMN "userUUID" TEXT,
ADD COLUMN "playlistUUID" TEXT;
ALTER TABLE "PlaylistMusic" ADD COLUMN "playlistUUID" TEXT,
ADD COLUMN "musicUUID" TEXT;

-- Backfill uuid columns from the old id relations
UPDATE "User" AS t SET "currentlyListeningUUID" = r."uuid" FROM "Music" AS r WHERE t."currentlyListeningId" = r."id";
UPDATE "FriendRequest" AS t SET "user_uuid" = r."uuid" FROM "User" AS r WHERE t."user_id" = r."id";
UPDATE "FriendRequest" AS t SET "friend_uuid" = r."uuid" FROM "User" AS r WHERE t."friend_id" = r."id";
UPDATE "Token" AS t SET "userUUID" = r."uuid" FROM "User" AS r WHERE t."userId" = r."id";
UPDATE "UserRole" AS t SET "userUUID" = r."uuid" FROM "User" AS r WHERE t."userId" = r."id";
UPDATE "Provider" AS t SET "ownerUUID" = r."uuid" FROM "User" AS r WHERE t."ownerId" = r."id";
UPDATE "ProviderUser" AS t SET "providerUUID" = r."uuid" FROM "Provider" AS r WHERE t."providerId" = r."id";
UPDATE "ProviderUser" AS t SET "userUUID" = r."uuid" FROM "User" AS r WHERE t."userId" = r."id";
UPDATE "Playlist" AS t SET "ownerUUID" = r."uuid" FROM "User" AS r WHERE t."ownerId" = r."id";
UPDATE "UserPlaylist" AS t SET "userUUID" = r."uuid" FROM "User" AS r WHERE t."userId" = r."id";
UPDATE "UserPlaylist" AS t SET "playlistUUID" = r."uuid" FROM "Playlist" AS r WHERE t."playlistId" = r."id";
UPDATE "PlaylistMusic" AS t SET "playlistUUID" = r."uuid" FROM "Playlist" AS r WHERE t."playlistId" = r."id";
UPDATE "PlaylistMusic" AS t SET "musicUUID" = r."uuid" FROM "Music" AS r WHERE t."musicId" = r."id";

-- Enforce NOT NULL on required relations
ALTER TABLE "FriendRequest" ALTER COLUMN "user_uuid" SET NOT NULL,
ALTER COLUMN "friend_uuid" SET NOT NULL;
ALTER TABLE "UserRole" ALTER COLUMN "userUUID" SET NOT NULL;
ALTER TABLE "Provider" ALTER COLUMN "ownerUUID" SET NOT NULL;
ALTER TABLE "ProviderUser" ALTER COLUMN "providerUUID" SET NOT NULL,
ALTER COLUMN "userUUID" SET NOT NULL;
ALTER TABLE "Playlist" ALTER COLUMN "ownerUUID" SET NOT NULL;
ALTER TABLE "UserPlaylist" ALTER COLUMN "userUUID" SET NOT NULL,
ALTER COLUMN "playlistUUID" SET NOT NULL;
ALTER TABLE "PlaylistMusic" ALTER COLUMN "playlistUUID" SET NOT NULL,
ALTER COLUMN "musicUUID" SET NOT NULL;

-- DropColumn (old id relations)
ALTER TABLE "User" DROP COLUMN "currentlyListeningId";
ALTER TABLE "FriendRequest" DROP COLUMN "user_id",
DROP COLUMN "friend_id";
ALTER TABLE "Token" DROP COLUMN "userId";
ALTER TABLE "UserRole" DROP COLUMN "userId";
ALTER TABLE "Provider" DROP COLUMN "ownerId";
ALTER TABLE "ProviderUser" DROP COLUMN "providerId",
DROP COLUMN "userId";
ALTER TABLE "Playlist" DROP COLUMN "ownerId";
ALTER TABLE "UserPlaylist" DROP COLUMN "userId",
DROP COLUMN "playlistId";
ALTER TABLE "PlaylistMusic" DROP COLUMN "playlistId",
DROP COLUMN "musicId";

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_user_uuid_friend_uuid_key" ON "FriendRequest"("user_uuid", "friend_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userUUID_roleId_key" ON "UserRole"("userUUID", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderUser_providerUUID_userUUID_key" ON "ProviderUser"("providerUUID", "userUUID");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlaylist_userUUID_playlistUUID_key" ON "UserPlaylist"("userUUID", "playlistUUID");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentlyListeningUUID_fkey" FOREIGN KEY ("currentlyListeningUUID") REFERENCES "Music"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_friend_uuid_fkey" FOREIGN KEY ("friend_uuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_providerUUID_fkey" FOREIGN KEY ("providerUUID") REFERENCES "Provider"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMusic" ADD CONSTRAINT "PlaylistMusic_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMusic" ADD CONSTRAINT "PlaylistMusic_musicUUID_fkey" FOREIGN KEY ("musicUUID") REFERENCES "Music"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

