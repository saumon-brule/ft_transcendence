-- DropForeignKey
ALTER TABLE "PlaylistMusic" DROP CONSTRAINT "PlaylistMusic_playlistUUID_fkey";

-- DropForeignKey
ALTER TABLE "UserPlaylist" DROP CONSTRAINT "UserPlaylist_playlistUUID_fkey";

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMusic" ADD CONSTRAINT "PlaylistMusic_playlistUUID_fkey" FOREIGN KEY ("playlistUUID") REFERENCES "Playlist"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
