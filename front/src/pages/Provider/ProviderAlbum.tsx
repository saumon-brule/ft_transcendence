import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import "./Provider.scss";
import { useProviderAlbumQuery } from "~/api/queryHooks/providerInfo";
import ProviderAlbumHeader from "./ProviderAlbumHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";

export default function ProviderAlbum() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string; albumUUID: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const album = useProviderAlbumQuery(() => providerBack.data?.body.address ?? "", () => params.uuid, () => params.albumUUID);
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
			<ProviderAlbumHeader album={data.info} providerBack={data.back} />
			<section>
				<h2>Musiques</h2>
				<MusicSection music={data.info.music} hiddenColumns={["album"]} />
			</section>
			<section>
				<h2>Artists</h2>
				<ArtistSection artist={{ total: data.info.artists.length, artists: data.info.artists }} providerUrl={data.back.address} providerUuid={params.uuid} />
			</section>
		</>}</Show>
	</div>;
}
