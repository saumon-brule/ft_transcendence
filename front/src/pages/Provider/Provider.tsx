import { useParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { summonErrorToast } from "~/components/ui/Toaster";
import { client, queryKeys } from "~/api/client";
import { useProviderInfoQuery } from "~/api/queryHooks/providerInfo";
import ProviderHeader from "./ProviderHeader";
import MusicSection from "../../components/ui/MusicSection/MusicSection";
import "./Provider.scss";

export default function Provider() {
	const navigate = useNavigate();
	const params = useParams<{ uuid: string }>();
	const providerBack = client.providers.get.createQuery(() => queryKeys.providers.get([params.uuid]), { params: { uuid: params.uuid } });
	const provider = useProviderInfoQuery(() => providerBack.data?.body.address ?? "");
	const data = createMemo(() => provider.data && providerBack.data
		? { info: provider.data.body, back: providerBack.data.body }
		: undefined);

	createEffect(() => {
		if (providerBack.isError) {
			navigate("/home");
			summonErrorToast("Unknown provider");
		}
	});

	return <div class="page" id="provider">
		<Show when={data()} keyed>{(data) => <>
			<ProviderHeader provider={data.info} providerBack={data.back} />
			<section>
				<h2>Musiques</h2>
				<MusicSection music={data.info.music} providerUrl={data.back.address} providerUuid={params.uuid} />
			</section>
		</>}</Show>
	</div>;
}
