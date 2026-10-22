import { For, Show } from "solid-js";
import "./Providers.scss";
import ProviderCard from "./ProviderCard";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import { summonNewProviderPopUp } from "./popUps/newProviderPopUp";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";

export default function Providers() {
	const me = useMeProfileQuery();

	return <div id="providers-page">
		<div class="providers-header">
			<h1>My Providers</h1>
			<Button onClick={() => summonNewProviderPopUp()}><Plus/>New provider</Button>
		</div>
		<Show when={me.data} keyed>{(data) => <div class="providers-list">
			<For each={data.body.ownedProviders}>{(provider) => <ProviderCard provider={provider} mine={true} />}</For>
			{/* <pre><code>{JSON.stringify(data.body.ownedProviders, null, 2)}</code></pre> */}
		</div>}</Show>
	</div>;
}
