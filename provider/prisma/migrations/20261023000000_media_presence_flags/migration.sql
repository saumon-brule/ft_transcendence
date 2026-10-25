-- AlterTable
ALTER TABLE "Music" ADD COLUMN "hasAudio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasCover" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Music" SET "hasAudio" = ("path" <> ''), "hasCover" = ("coverPath" IS NOT NULL);
ALTER TABLE "Music" DROP COLUMN "path",
DROP COLUMN "coverPath";

-- AlterTable
ALTER TABLE "Album" ADD COLUMN "hasCover" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Album" SET "hasCover" = ("coverPath" IS NOT NULL);
ALTER TABLE "Album" DROP COLUMN "coverPath";

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "hasAvatar" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Artist" SET "hasAvatar" = ("coverPath" IS NOT NULL);
ALTER TABLE "Artist" DROP COLUMN "coverPath";
