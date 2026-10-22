import { onCleanup, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { summonPasswordEditPopUp } from "./editionPopUps/passwordPopUp";
import { summonUsernameEditPopUp } from "./editionPopUps/usernamePopUp";
import { summonEmailEditPopUp } from "./editionPopUps/emailPopUp";
import { OverlayControls } from "~/components/ui/Overlay";
import { client } from "~/api/client";
import { useTranslation } from "~/i18n/context";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";

import "./AccountSettings.scss";

export default function AccountSettings() {
	const { t } = useTranslation();

	const profileQuery = useMeProfileQuery();
	const requestEmailResetMutation = client.auth.requestPasswordReset.createMutation();


	function requestSetPassword(e: MouseEvent) {
		e.preventDefault();
		if (!profileQuery.data?.body.email) return;
		requestEmailResetMutation.mutate(
			{ body: { email: profileQuery.data.body.email } },
			{
				onSuccess: () => {
					summonSuccessToast(() => <>{t("pages.settings.account.password.passwordSetEmailSent")}<b>{profileQuery.data.body.email}</b></>);
				},
				onError: (err) => {
					if (err.status !== 429) {
						summonErrorToast(() => t("pages.settings.account.password.passwordSetEmailError"));
					}
				},
			},
		);
	}

	let usernameEditPopUpControls: OverlayControls | null = null;
	let passwordEditPopUpControls: OverlayControls | null = null;
	let emailEditPopUpControls: OverlayControls | null = null;

	onCleanup(() => {
		usernameEditPopUpControls?.close();
		passwordEditPopUpControls?.close();
		emailEditPopUpControls?.close();
	});

	return <main class="account-settings">
		<h1>{t("pages.settings.account.title")}</h1>
		<Show when={profileQuery.data ? profileQuery.data.body : undefined}>
			{(user) => <div class="settings-content">
				<div class="setting-field">
					<div class="setting-field-title">
						<h3>{t("pages.settings.account.username.title")}</h3>
						<Button variant="link" onClick={(e) => {
							e.preventDefault();
							usernameEditPopUpControls = summonUsernameEditPopUp(() => usernameEditPopUpControls = null);
						}} >{t("pages.settings.edit")}</Button>
					</div>
					<div class="setting-field-value">{user().username}</div>
				</div>
				<div class="setting-field">
					<div class="setting-field-title">
						<h3>{t("pages.settings.account.password.title")}<span class="secondary-info">{user().hasPassword ? t("pages.settings.account.password.set") : t("pages.settings.account.password.unset")}</span></h3>
						<Button variant="link" onClick={user().hasPassword
							? (e) => {
								e.preventDefault();
								passwordEditPopUpControls = summonPasswordEditPopUp(() => passwordEditPopUpControls = null);
							}
							: requestSetPassword} >{user().hasPassword ? t("pages.settings.edit") : t("pages.settings.set")}</Button>
					</div>
				</div>
				<div class="setting-field">
					<div class="setting-field-title">
						<h3>{t("pages.settings.account.email.title")}</h3>
						<Button variant="link" onClick={(e) => {
							e.preventDefault();
							emailEditPopUpControls = summonEmailEditPopUp(() => emailEditPopUpControls = null);
						}} >{t("pages.settings.edit")}</Button>
					</div>
					<div class="setting-field-value">{user().email}</div>
				</div>
			</div>}
		</Show>
	</main>;
}
