import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import "./Provider.scss";
import { useProviderAlbumsInfiniteQuery, useProviderArtistQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import ProviderArtistHeader from "./ProviderArtistHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import Button from "~/components/inputs/Button";

export default function ProviderArtist() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string; artistUUID: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const providerUrl = () => providerBack.data?.body.address ?? "";
	const artist = useProviderArtistQuery(providerUrl, () => params.uuid, () => params.artistUUID);
	const musicsQuery = useProviderMusicsInfiniteQuery(providerUrl, () => params.uuid, () => "", () => ({ artistUuid: params.artistUUID }));
	const albumsQuery = useProviderAlbumsInfiniteQuery(providerUrl, () => params.uuid, () => "", () => ({ artistUuid: params.artistUUID }));
	const musics = createMemo(() => musicsQuery.data && {
		musics: musicsQuery.data.pages.flatMap((page) => page.musics),
		total: musicsQuery.data.pages[0]?.total ?? 0,
	});
	const albums = createMemo(() => albumsQuery.data && {
		albums: albumsQuery.data.pages.flatMap((page) => page.albums),
		total: albumsQuery.data.pages[0]?.total ?? 0,
	});
	const data = createMemo(() => artist.data && providerBack.data
		? { info: artist.data.body, back: providerBack.data.body }
		: undefined);

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
		if (artist.isError) {
			navigate(`/provider/${params.uuid}`);
			summonErrorToast("Unknown artist");
		}
	});

	return <div class="page" id="provider">
		<Show when={data()} keyed>{(data) => <>
			<ProviderArtistHeader artist={data.info} providerBack={data.back} musicTotal={musics()?.total} albumTotal={albums()?.total} />
			<section>
				<h2>Musiques</h2>
				<Show when={musics()} keyed>
					{(music) => <MusicSection musicGroup={{
						name: data.info.name,
						musics: data.info.music.musics,
						route: `/provider/${data.back.uuid}/artist/${data.info.uuid}`,
					}} musics={data.info.music.musics} hiddenColumns={["artists"]} />}
				</Show>
				<Show when={musicsQuery.hasNextPage}>
					<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
				</Show>
			</section>
			<section>
				<h2>Albums</h2>
				<Show when={albums()} keyed>{(album) => <AlbumSection album={album} hiddenProp={["artists"]} />}</Show>
				<Show when={albumsQuery.hasNextPage}>
					<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
				</Show>
			</section>
		</>}</Show>
	</div>;
}
