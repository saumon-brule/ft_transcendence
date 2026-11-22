import Button from "~/components/inputs/Button";
import { client } from "~/api/client";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { API_MAX_USAGE_PER_HOUR } from "@flex/shared";

import "./ApiSettings.scss";
import { summonPublicKeyPopUp } from "./editionPopUps/regenerateKeyPopUp";
import { A } from "@solidjs/router";
import { env } from "~/env";
import { useProfile } from "~/components/guards/ProfileGate";
import { useTranslation } from "~/i18n/context";

export default function ApiSettings() {
	const { t } = useTranslation();
	const user = useProfile();
	const regenerateKeyMutation = client.users.regenerateApiKey.createMutation();

	function regenerateKey() {
		regenerateKeyMutation.mutate({}, {
			onSuccess: (data) => {
				summonPublicKeyPopUp(data.body.apiKey);
			},
			onError: () => {
				summonErrorToast(t("errors.generic"));
			},
		});
	}

	return <section class="api-settings">
		<div class="settings-content">
			<div class="setting-field">
				<div class="setting-field-title">
					<h3>{t("pages.settings.api.title")}</h3>
					<Button type="button" variant="link" onClick={regenerateKey}>{t("pages.settings.api.regenerateKey")}</Button>
				</div>
				<div class="setting-field-value">{t("pages.settings.api.usage", { count: String(user().apiUsage) })}</div>
				<div class="setting-field-value">{t("pages.settings.api.hourlyUsage", { count: String(user().apiOneHourUsage), max: String(API_MAX_USAGE_PER_HOUR) })}</div>
				<div class="setting-field-value"><A href={`${env.VITE_API_URL}/api/swagger`} target="_blank">{t("pages.settings.api.documentation")}</A></div>
			</div>
		</div>
	</section>;
}
