import Button from "~/components/inputs/Button";
import { client } from "~/api/client";
import { summonErrorToast } from "~/components/ui/Toaster";
import { API_MAX_USAGE_PER_HOUR } from "@flex/shared";

import "./ApiSettings.scss";
import { summonPublicKeyPopUp } from "./editionPopUps/regenerateKeyPopUp";
import { A } from "@solidjs/router";
import { env } from "~/env";
import { useProfile } from "~/components/guards/ProfileGate";

export default function ApiSettings() {
	const user = useProfile();
	const regenerateKeyMutation = client.users.regenerateApiKey.createMutation();

	function regenerateKey() {
		regenerateKeyMutation.mutate({}, {
			onSuccess: (data) => {
				summonPublicKeyPopUp(data.body.apiKey);
			},
			onError: () => {
				summonErrorToast("An error occured");
			},
		});
	}

	return <section class="api-settings">
		<div class="settings-content">
			<div class="setting-field">
				<div class="setting-field-title">
					<h3>Api usage</h3>
					<Button type="button" variant="link" onClick={regenerateKey}>Regenerate key</Button>
				</div>
				<div class="setting-field-value">Api usage {user().apiUsage}</div>
				<div class="setting-field-value">Hourly usage {user().apiOneHourUsage}/{API_MAX_USAGE_PER_HOUR}</div>
				<div class="setting-field-value"><A href={`${env.VITE_API_URL}/api/swagger`} target="_blank">Documentation</A></div>
			</div>
		</div>
	</section>;
}
