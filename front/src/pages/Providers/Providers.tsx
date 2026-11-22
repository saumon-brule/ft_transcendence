import { For } from "solid-js";
import "./Providers.scss";
import ProviderCard from "../../components/ui/ProviderCard/ProviderCard";
import Button from "~/components/inputs/Button";
import { Plus } from "lucide-solid";
import { summonNewProviderPopUp } from "./popUps/newProviderPopUp";
import { useProfile } from "~/components/guards/ProfileGate";
import { useTranslation } from "~/i18n/context";

export default function Providers() {
	const { t } = useTranslation();
	const me = useProfile();

	return <div id="providers-page" class="page">
		<div class="providers-header">
			<h1>{t("pages.providers.title")}</h1>
			<Button onClick={() => summonNewProviderPopUp()} aria-label={t("pages.providers.newPopUp.title")}><Plus/><span class="btn-label">{t("pages.providers.newPopUp.title")}</span></Button>
		</div>
		<div class="providers-list">
			<For each={me().ownedProviders}>{(provider) => <ProviderCard provider={provider} mine={true} />}</For>
			{/* <pre><code>{JSON.stringify(me().ownedProviders, null, 2)}</code></pre> */}
		</div>
	</div>;
}
