import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import "./Provider.scss";
import { useProviderAlbumQuery, useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import ProviderAlbumHeader from "./ProviderAlbumHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import Button from "~/components/inputs/Button";

export default function ProviderAlbum() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string; albumUUID: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const providerUrl = () => providerBack.data?.body.address ?? "";
	const album = useProviderAlbumQuery(providerUrl, () => params.uuid, () => params.albumUUID);
	const musicsQuery = useProviderMusicsInfiniteQuery(providerUrl, () => params.uuid, () => "", () => ({ albumUuid: params.albumUUID }));
	const musics = createMemo(() => musicsQuery.data && {
		musics: musicsQuery.data.pages.flatMap((page) => page.musics),
		total: musicsQuery.data.pages[0]?.total ?? 0,
	});
	const data = createMemo(() => album.data && providerBack.data
		? { info: album.data.body, back: providerBack.data.body }
		: undefined);

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
		if (album.isError) {
			navigate(`/provider/${params.uuid}`);
			summonErrorToast("Unknown album");
		}
	});

	return <div class="page" id="provider">
		<Show when={data()} keyed>{(data) => <>
			<ProviderAlbumHeader album={data.info} providerBack={data.back} musicTotal={musics()?.total} />
			<section>
				<h2>Musiques</h2>
				<Show when={musics()} keyed>{(music) => <MusicSection music={music} hiddenColumns={["album"]} />}</Show>
				<Show when={musicsQuery.hasNextPage}>
					<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
				</Show>
			</section>
			<section>
				<h2>Artists</h2>
				<ArtistSection artist={{ total: data.info.artists.length, artists: data.info.artists }}/>
			</section>
		</>}</Show>
	</div>;
}
