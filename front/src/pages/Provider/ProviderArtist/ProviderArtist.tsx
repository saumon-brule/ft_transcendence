import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import "../Provider.scss";
import { useProviderAlbumsInfiniteQuery, useProviderArtistQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import ProviderArtistHeader from "./ProviderArtistHeader";
import MusicSection from "~/components/ui/sections/MusicSection/MusicSection";
import AlbumSection from "~/components/ui/sections/AlbumSection/AlbumSection";
import Button from "~/components/inputs/Button";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { useTranslation } from "~/i18n/context";

export default function ProviderArtist() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const provider = useProvider();
	const params = useParams<{ uuid: string; artistUUID: string }>();
	const artist = useProviderArtistQuery(() => provider, () => params.artistUUID);
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => "", () => ({ artistUuid: params.artistUUID }));
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => provider, () => "", () => ({ artistUuid: params.artistUUID }));
	const musics = createMemo(() => musicsQuery.data?.pages.flatMap((page) => page.musics));
	const albums = createMemo(() => albumsQuery.data && {
		albums: albumsQuery.data.pages.flatMap((page) => page.albums),
		total: albumsQuery.data.pages[0]?.total ?? 0,
	});

	createEffect(() => {
		if (artist.isError) {
			navigate(`/provider/${provider.uuid}`, { replace: true });
			summonErrorToast(t("pages.provider.unknownArtist"));
		}
	});


	return <div class="page" id="provider">
		<Show when={artist.data?.body} keyed>{(info) => {
			const musicGroup = () => {
				const music = musics();
				return music ? { name: info.name, musics: music, route: `/provider/${provider.uuid}/artist/${info.uuid}` } : null;
			};

			return <>
				<ProviderArtistHeader artist={info} />
				<section>
					<h2>{t("common.tabs.Musics")}</h2>
					<Show when={musicGroup()} keyed>
						{(musicGroup) => <MusicSection musicGroup={musicGroup} hiddenColumns={["artists"]} />}
					</Show>
					<Show when={musicsQuery.hasNextPage}>
						<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">{t("pages.search.seeMore")}</Button>
					</Show>
				</section>
				<section>
					<h2>{t("common.tabs.Albums")}</h2>
					<Show when={albums()} keyed>{(album) => <AlbumSection album={album} hiddenProp={["artists"]} />}</Show>
					<Show when={albumsQuery.hasNextPage}>
						<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">{t("pages.search.seeMore")}</Button>
					</Show>
				</section>
			</>;
		}}</Show>
	</div>;
}
