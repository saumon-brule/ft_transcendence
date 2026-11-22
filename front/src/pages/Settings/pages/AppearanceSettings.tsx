import { useTranslation } from "~/i18n/context";
import Toggle from "~/components/inputs/Toggle/Toggle";
import { appearanceStore, changeTheme, changeUseDevice } from "~/store/appearance.store";

import "./AppearanceSettings.scss";

export default function AppearanceSettings() {
	const { t } = useTranslation();

	return <section class="appearance-settings">
		<div class="settings-content">
			<div class="setting-field">
				<div class="setting-field-title">
					<h3>{t("pages.settings.appearance.theme.title")}</h3>
				</div>
				<div class="setting-field-value">
					<div>
						<Toggle disabled={appearanceStore.useDevice} checked={appearanceStore.theme === "dark"} onChange={(e) => { changeTheme(e.currentTarget.checked ? "dark" : "light"); }} label={t("pages.settings.appearance.theme.darkMode")} />
					</div>
					<div>
						<Toggle checked={appearanceStore.useDevice} onChange={(e) => { changeUseDevice(e.currentTarget.checked); }} label={t("pages.settings.appearance.theme.useSystem")} />
					</div>
				</div>
			</div>
		</div>
	</section>;
}
