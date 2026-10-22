import { For, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import "./Providers.scss";
import ProviderCard from "./ProviderCard";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import { type User } from "@flex/shared";
import { summonNewProviderPopUp } from "./popUps/newProviderPopUp";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";

type EditProviderProps = {
	provider: User["ownedProviders"][number];
};
function EditProviderPopUp(props: EditProviderProps) {
	return <div style={{ padding: "1rem" }}>
		<h2>Edit provider</h2>
		<p>Coming soon...</p>
	</div>;
}

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
