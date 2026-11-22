import { Controller, UseGuards } from "@nestjs/common";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { apiContract, playlistsContract } from "@flex/shared";
import { PublicApiKeyGuard } from "../core/guards/public-api-key.guard";
import { ApiUser } from "../core/decorators/api-user.decorator";
import { PlaylistsService } from "../playlists/playlists.service";

@Controller()
@UseGuards(PublicApiKeyGuard)
export class ApiPlaylistController {
    constructor(private readonly playlistsService: PlaylistsService) {}

    @TsRestHandler(apiContract.listPlaylists)
    @UseGuards(PublicApiKeyGuard)
    public listPlaylists(@ApiUser() ApiUser: ApiUser) {
        return tsRestHandler(apiContract.listPlaylists, async () => {
            const playlists = await this.playlistsService.listPlaylists(ApiUser.uuid);
            return { status: 200, body: playlists };
        });
    }

    @TsRestHandler(apiContract.createPlaylist)
    @UseGuards(PublicApiKeyGuard)
    public createPlaylist(@ApiUser() apiUser: ApiUser) {
        return tsRestHandler(apiContract.createPlaylist, async ({ body }) => {
            const playlist = await this.playlistsService.createPlaylist(
                body.name,
                apiUser.uuid,
                body.private,
            );

            return {
                status: 201,
                body: {
                    uuid: playlist.uuid,
                    name: playlist.name,
                    private: playlist.private,
                },
            };
        });
    }

    @TsRestHandler(apiContract.deletePlaylist)
    @UseGuards(PublicApiKeyGuard)
    public deletePlaylist(@ApiUser() apiUser: ApiUser) {
        return tsRestHandler(apiContract.deletePlaylist, async ({ params }) => {
            await this.playlistsService.deletePlaylist(
                params.uuid,
                apiUser.uuid
            );

        return { status: 204, body: null };
        });
    }

    @TsRestHandler(apiContract.updatePlaylistName)
    @UseGuards(PublicApiKeyGuard)
    public updatePlaylistName(@ApiUser() ApiUser: ApiUser) {
        return tsRestHandler(playlistsContract.updatePlaylistName, async ({ params, body }) => {
            await this.playlistsService.updatePlaylistName(
                params.uuid,
                body.name,
                ApiUser.uuid,
            );

            return { status: 204, body: null };
        });
    }

    @TsRestHandler(apiContract.setPlaylistPrivacy)
    @UseGuards(PublicApiKeyGuard)
    public setPlaylistPrivacy(@ApiUser() ApiUser: ApiUser) {
        return tsRestHandler(playlistsContract.setPlaylistPrivacy, async ({ params, body }) => {
            await this.playlistsService.setPlaylistPrivacy(
                params.uuid,
                body.private,
                ApiUser.uuid,
            );

            return { status: 204, body: null };
        })
    }

    @TsRestHandler(apiContract.addMusicToPlaylist)
    @UseGuards(PublicApiKeyGuard)
    public addMusicToPlaylist(@ApiUser() apiUser: ApiUser) {
        return tsRestHandler(apiContract.addMusicToPlaylist, async ({ params, body }) => {
            await this.playlistsService.addMusicToPlaylist(
                params.uuid,
                body.musicUUID,
                body.providerUUID,
                apiUser.uuid,
            );

            return { status: 204, body: null};
        });
    }

    @TsRestHandler(apiContract.removeMusicFromPlaylist)
    @UseGuards(PublicApiKeyGuard)
    public removeMusicFromPlaylist(@ApiUser() apiUser: ApiUser) {
        return tsRestHandler(apiContract.removeMusicFromPlaylist, async ({ params, body }) => {
            await this.playlistsService.removeMusicFromPlaylist(
                params.uuid,
                body.musicUUID,
                body.providerUUID,
                apiUser.uuid,
            );

            return { status: 204, body: null };
        });
    }

    @TsRestHandler(apiContract.overwritePlaylist)
    @UseGuards(PublicApiKeyGuard)
    public overwritePlaylist(@ApiUser() ApiUser: ApiUser) {
        return tsRestHandler(apiContract.overwritePlaylist, async ({ params, body }) => {
            await this.playlistsService.overwritePlaylist(
                params.uuid,
                body.musics,
                ApiUser.uuid,
            );

            return { status: 204, body: null };
        });
    }
}
