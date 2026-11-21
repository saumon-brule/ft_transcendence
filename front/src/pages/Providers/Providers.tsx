import { For } from "solid-js";
import "./Providers.scss";
import ProviderCard from "../../components/ui/ProviderCard/ProviderCard";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import { summonNewProviderPopUp } from "./popUps/newProviderPopUp";
import { useProfile } from "~/components/guards/ProfileGate";

export default function Providers() {
	const me = useProfile();

	return <div id="providers-page" class="page">
		<div class="providers-header">
			<h1>My Providers</h1>
			<Button onClick={() => summonNewProviderPopUp()} aria-label="New provider"><Plus/><span class="btn-label">New provider</span></Button>
		</div>
		<div class="providers-list">
			<For each={me().ownedProviders}>{(provider) => <ProviderCard provider={provider} mine={true} />}</For>
			{/* <pre><code>{JSON.stringify(me().ownedProviders, null, 2)}</code></pre> */}
		</div>
	</div>;
}
