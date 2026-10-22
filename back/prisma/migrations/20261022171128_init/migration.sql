-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_friend_uuid_fkey";

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_ownerUUID_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistMusic" DROP CONSTRAINT "PlaylistMusic_musicUUID_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistMusic" DROP CONSTRAINT "PlaylistMusic_playlistUUID_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_ownerUUID_fkey";

-- DropForeignKey
ALTER TABLE "ProviderUser" DROP CONSTRAINT "ProviderUser_providerUUID_fkey";

-- DropForeignKey
ALTER TABLE "ProviderUser" DROP CONSTRAINT "ProviderUser_userUUID_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlaylist" DROP CONSTRAINT "UserPlaylist_playlistUUID_fkey";

-- DropForeignKey
ALTER TABLE "UserPlaylist" DROP CONSTRAINT "UserPlaylist_userUUID_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userUUID_fkey";

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_friend_uuid_fkey" FOREIGN KEY ("friend_uuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_providerUUID_fkey" FOREIGN KEY ("providerUUID") REFERENCES "Provider"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMusic" ADD CONSTRAINT "PlaylistMusic_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMusic" ADD CONSTRAINT "PlaylistMusic_musicUUID_fkey" FOREIGN KEY ("musicUUID") REFERENCES "Music"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
