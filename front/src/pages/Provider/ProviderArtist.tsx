import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import "./Provider.scss";
import { useProviderArtistQuery } from "~/api/queryHooks/providerInfo";
import ProviderArtistHeader from "./ProviderArtistHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";

export default function ProviderArtist() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string; artistUUID: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const artist = useProviderArtistQuery(() => providerBack.data?.body.address ?? "", () => params.uuid, () => params.artistUUID);
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
			<ProviderArtistHeader artist={data.info} providerBack={data.back} />
			<section>
				<h2>Musiques</h2>
				<MusicSection music={data.info.music} hiddenColumns={["artists"]} />
			</section>
			<section>
				<h2>Albums</h2>
				<AlbumSection album={data.info.album} providerUrl={data.back.address} providerUuid={params.uuid} hiddenProp={["artists"]} />
			</section>
		</>}</Show>
	</div>;
}
