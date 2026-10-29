-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_search";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_CATALOG', 'MANAGE_MEMBERS', 'MANAGE_ROLES');

-- CreateTable
CREATE TABLE "Provider" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "uuid" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "ownerUuid" TEXT NOT NULL,
    "defaultRoleUuid" TEXT,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "userUuid" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUuid" TEXT,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByUuid" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRole" (
    "id" SERIAL NOT NULL,
    "memberUuid" TEXT NOT NULL,
    "roleUuid" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "addedByUuid" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleUuid" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Music" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "searchArtists" TEXT NOT NULL DEFAULT '',
    "searchAlbum" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER NOT NULL,
    "albumUuid" TEXT,
    "publishedAt" TIMESTAMP(3),
    "addedByUuid" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicArtist" (
    "id" SERIAL NOT NULL,
    "musicUuid" TEXT NOT NULL,
    "artistUuid" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hasAvatar" BOOLEAN NOT NULL DEFAULT false,
    "biography" TEXT,
    "addedByUuid" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumArtist" (
    "id" SERIAL NOT NULL,
    "albumUuid" TEXT NOT NULL,
    "artistUuid" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchArtists" TEXT NOT NULL DEFAULT '',
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "addedByUuid" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_uuid_key" ON "Provider"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_ownerUuid_key" ON "Provider"("ownerUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_defaultRoleUuid_key" ON "Provider"("defaultRoleUuid");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_uuid_key" ON "AccessRequest"("uuid");

-- CreateIndex
CREATE INDEX "AccessRequest_decidedByUuid_idx" ON "AccessRequest"("decidedByUuid");

-- CreateIndex
CREATE INDEX "AccessRequest_status_createdAt_idx" ON "AccessRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AccessRequest_userUuid_idx" ON "AccessRequest"("userUuid");

-- CreateIndex
CREATE INDEX "AccessRequest_uuid_idx" ON "AccessRequest"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Member_uuid_key" ON "Member"("uuid");

-- CreateIndex
CREATE INDEX "Member_revokedByUuid_idx" ON "Member"("revokedByUuid");

-- CreateIndex
CREATE INDEX "Member_uuid_idx" ON "Member"("uuid");

-- CreateIndex
CREATE INDEX "MemberRole_roleUuid_memberUuid_idx" ON "MemberRole"("roleUuid", "memberUuid");

-- CreateIndex
CREATE UNIQUE INDEX "MemberRole_memberUuid_roleUuid_key" ON "MemberRole"("memberUuid", "roleUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_uuid_key" ON "Role"("uuid");

-- CreateIndex
CREATE INDEX "Role_addedByUuid_idx" ON "Role"("addedByUuid");

-- CreateIndex
CREATE INDEX "RolePermission_permission_roleUuid_idx" ON "RolePermission"("permission", "roleUuid");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleUuid_permission_key" ON "RolePermission"("roleUuid", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "Music_uuid_key" ON "Music"("uuid");

-- CreateIndex
CREATE INDEX "Music_addedByUuid_idx" ON "Music"("addedByUuid");

-- CreateIndex
CREATE INDEX "Music_albumUuid_idx" ON "Music"("albumUuid");

-- CreateIndex
CREATE INDEX "Music_uuid_idx" ON "Music"("uuid");

-- CreateIndex
CREATE INDEX "MusicArtist_artistUuid_musicUuid_idx" ON "MusicArtist"("artistUuid", "musicUuid");

-- CreateIndex
CREATE UNIQUE INDEX "MusicArtist_musicUuid_artistUuid_key" ON "MusicArtist"("musicUuid", "artistUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_uuid_key" ON "Artist"("uuid");

-- CreateIndex
CREATE INDEX "Artist_addedByUuid_idx" ON "Artist"("addedByUuid");

-- CreateIndex
CREATE INDEX "Artist_uuid_idx" ON "Artist"("uuid");

-- CreateIndex
CREATE INDEX "AlbumArtist_artistUuid_albumUuid_idx" ON "AlbumArtist"("artistUuid", "albumUuid");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumArtist_albumUuid_artistUuid_key" ON "AlbumArtist"("albumUuid", "artistUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Album_uuid_key" ON "Album"("uuid");

-- CreateIndex
CREATE INDEX "Album_addedByUuid_idx" ON "Album"("addedByUuid");

-- CreateIndex
CREATE INDEX "Album_uuid_idx" ON "Album"("uuid");

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

-- CreateFunction
CREATE FUNCTION "refresh_music_artists"(target TEXT) RETURNS void
LANGUAGE sql
AS $$
	UPDATE "Music"
	SET "searchArtists" = COALESCE((
		SELECT string_agg(a."name", ' ' ORDER BY a."name")
		FROM "MusicArtist" ma
		JOIN "Artist" a ON a."uuid" = ma."artistUuid"
		WHERE ma."musicUuid" = target
	), '')
	WHERE "uuid" = target
$$;

-- CreateFunction
CREATE FUNCTION "refresh_album_artists"(target TEXT) RETURNS void
LANGUAGE sql
AS $$
	UPDATE "Album"
	SET "searchArtists" = COALESCE((
		SELECT string_agg(a."name", ' ' ORDER BY a."name")
		FROM "AlbumArtist" aa
		JOIN "Artist" a ON a."uuid" = aa."artistUuid"
		WHERE aa."albumUuid" = target
	), '')
	WHERE "uuid" = target
$$;

-- CreateTrigger
CREATE FUNCTION "trg_music_album_name"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW."searchAlbum" := COALESCE((SELECT "name" FROM "Album" WHERE "uuid" = NEW."albumUuid"), '');
	RETURN NEW;
END
$$;

CREATE TRIGGER "Music_search_album"
BEFORE INSERT OR UPDATE OF "albumUuid" ON "Music"
FOR EACH ROW EXECUTE FUNCTION "trg_music_album_name"();

-- CreateTrigger
CREATE FUNCTION "trg_music_artist_link"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP <> 'INSERT' THEN
		PERFORM "refresh_music_artists"(OLD."musicUuid");
	END IF;
	IF TG_OP <> 'DELETE' THEN
		PERFORM "refresh_music_artists"(NEW."musicUuid");
	END IF;
	RETURN NULL;
END
$$;

CREATE TRIGGER "MusicArtist_search"
AFTER INSERT OR UPDATE OR DELETE ON "MusicArtist"
FOR EACH ROW EXECUTE FUNCTION "trg_music_artist_link"();

-- CreateTrigger
CREATE FUNCTION "trg_album_artist_link"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP <> 'INSERT' THEN
		PERFORM "refresh_album_artists"(OLD."albumUuid");
	END IF;
	IF TG_OP <> 'DELETE' THEN
		PERFORM "refresh_album_artists"(NEW."albumUuid");
	END IF;
	RETURN NULL;
END
$$;

CREATE TRIGGER "AlbumArtist_search"
AFTER INSERT OR UPDATE OR DELETE ON "AlbumArtist"
FOR EACH ROW EXECUTE FUNCTION "trg_album_artist_link"();

-- CreateTrigger
CREATE FUNCTION "trg_artist_renamed"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM "refresh_music_artists"("musicUuid") FROM "MusicArtist" WHERE "artistUuid" = NEW."uuid";
	PERFORM "refresh_album_artists"("albumUuid") FROM "AlbumArtist" WHERE "artistUuid" = NEW."uuid";
	RETURN NULL;
END
$$;

CREATE TRIGGER "Artist_search"
AFTER UPDATE OF "name" ON "Artist"
FOR EACH ROW WHEN (OLD."name" IS DISTINCT FROM NEW."name")
EXECUTE FUNCTION "trg_artist_renamed"();

-- CreateTrigger
CREATE FUNCTION "trg_album_renamed"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE "Music" SET "searchAlbum" = NEW."name" WHERE "albumUuid" = NEW."uuid";
	RETURN NULL;
END
$$;

CREATE TRIGGER "Album_search"
AFTER UPDATE OF "name" ON "Album"
FOR EACH ROW WHEN (OLD."name" IS DISTINCT FROM NEW."name")
EXECUTE FUNCTION "trg_album_renamed"();

-- CreateIndex
CREATE INDEX "Music_search_bm25" ON "Music" USING bm25 (
	"id",
	("name"::pdb.simple('ascii_folding=true')),
	("searchArtists"::pdb.simple('ascii_folding=true')),
	("searchAlbum"::pdb.simple('ascii_folding=true'))
);

-- CreateIndex
CREATE INDEX "Artist_search_bm25" ON "Artist" USING bm25 (
	"id",
	("name"::pdb.simple('ascii_folding=true'))
);

-- CreateIndex
CREATE INDEX "Album_search_bm25" ON "Album" USING bm25 (
	"id",
	("name"::pdb.simple('ascii_folding=true')),
	("searchArtists"::pdb.simple('ascii_folding=true'))
);
