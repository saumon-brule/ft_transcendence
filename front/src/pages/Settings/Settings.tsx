import { A } from "@solidjs/router";
import { Match, Switch } from "solid-js";
import { useTranslation } from "~/i18n/context";
import Tabs from "~/components/ui/Tabs/Tabs";
import { useTabParam } from "~/components/ui/Tabs/useTabParam";
import AccountSettings from "./pages/AccountSettings";
import ProfileSettings from "./pages/ProfileSettings";
import AppearanceSettings from "./pages/AppearanceSettings";
import "./Settings.scss";

const TABS = ["account", "profile", "appearance"] as const;
type Tab = typeof TABS[number];

export default function Settings() {
	const { t } = useTranslation();
	const [tab, setTab] = useTabParam(TABS, "account");

	const label = (tab: Tab) => {
		switch (tab) {
			case "account": return t("pages.settings.accountLink");
			case "profile": return t("pages.settings.profileLink");
			case "appearance": return t("pages.settings.appearanceLink");
		}
	};

	return <div class="page" id="settings">
		<h1>{t("pages.settings.title")}</h1>
		<Tabs tabs={TABS} value={tab()} onChange={setTab} label={label} />
		<Switch>
			<Match when={tab() === "account"}><AccountSettings /></Match>
			<Match when={tab() === "profile"}><ProfileSettings /></Match>
			<Match when={tab() === "appearance"}><AppearanceSettings /></Match>
		</Switch>
	</div>;
}
