/*
  Warnings:

  - A unique constraint covering the columns `[playlistUUID,musicUUID]` on the table `PlaylistMusic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlaylistMusic_playlistUUID_musicUUID_key" ON "PlaylistMusic"("playlistUUID", "musicUUID");
