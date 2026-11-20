import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import "../Provider.scss";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { useProviderAlbumQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import ProviderAlbumHeader from "./ProviderAlbumHeader";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import Button from "~/components/inputs/Button";

export default function ProviderAlbum() {
	const navigate = useNavigate();
	const provider = useProvider();
	const params = useParams<{ uuid: string; albumUUID: string }>();
	const album = useProviderAlbumQuery(() => provider, () => params.albumUUID);
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => "", () => ({ albumUuid: params.albumUUID }));
	const musics = createMemo(() => musicsQuery.data?.pages.flatMap((page) => page.musics));

	createEffect(() => {
		if (album.isError) {
			navigate(`/provider/${provider.uuid}`);
			summonErrorToast("Unknown album");
		}
	});

	return <div class="page" id="provider">
		<Show when={album.data?.body} keyed>{(info) => {
			const musicGroup = () => {
				const music = musics();
				return music ? { name: info.name, musics: music, route: `/provider/${provider.uuid}/album/${info.uuid}` } : null;
			};

			return <>
				<ProviderAlbumHeader album={info} />
				<section>
					<h2>Musiques</h2>
					<Show when={musicGroup()} keyed>
						{(musicGroup) => <MusicSection musicGroup={musicGroup} hiddenColumns={["album"]} />}
					</Show>
					<Show when={musicsQuery.hasNextPage}>
						<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
					</Show>
				</section>
				<section>
					<h2>Artists</h2>
					<ArtistSection artist={{ total: info.artists.length, artists: info.artists }} />
				</section>
			</>;
		}}</Show>
	</div>;
}
