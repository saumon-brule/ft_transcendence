import { createSignal, JSX, onCleanup, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { summonPasswordEditPopUp } from "./editionPopUps/passwordPopUp";
import { summonEmailEditPopUp } from "./editionPopUps/emailPopUp";
import { OverlayControls } from "~/components/ui/Overlay";
import { client, queryKeys } from "~/api/client";
import { useTranslation } from "~/i18n/context";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import Select from "~/components/inputs/Select/Select";
import { queryClient } from "~/App";
import { ClientInferResponses } from "@ts-rest/core";
import { appContract } from "@flex/shared";

import "./AccountSettings.scss";

type SelectChangeHandler = JSX.EventHandler<HTMLSelectElement, Event>;
type UserMeResponse = ClientInferResponses<typeof appContract.users.me, 200>;

export default function AccountSettings() {
	const { t } = useTranslation();
	const [isLanguageChanging, setIsLanguageChanging] = createSignal(false);

	const profileQuery = useMeProfileQuery();
	const requestEmailResetMutation = client.auth.requestPasswordReset.createMutation();
	const updateMeMutation = client.users.updateMe.createMutation();


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

	const changeLanguage: SelectChangeHandler = (e) => {
		setIsLanguageChanging(true);
		const newLanguage = e.currentTarget.value as "en" | "fr";
		updateMeMutation.mutate(
			{ body: { language: newLanguage } },
			{
				onSuccess: () => {
					queryClient.setQueryData<UserMeResponse>(queryKeys.users.me(), (old) => {
						if (!old) return old;
						return { ...old, body: { ...old.body, language: newLanguage } };
					});
				},
				onSettled: () => { setIsLanguageChanging(false); },
			},
		);

	};

	let passwordEditPopUpControls: OverlayControls | null = null;
	let emailEditPopUpControls: OverlayControls | null = null;

	onCleanup(() => {
		passwordEditPopUpControls?.close();
		emailEditPopUpControls?.close();
	});

	return <main class="account-settings">
		<h1>{t("pages.settings.account.title")}</h1>
		<Show when={profileQuery.data ? profileQuery.data.body : undefined}>
			{(user) => <div class="settings-content">
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
						<h3>{t("pages.settings.account.language.title")}</h3>
					</div>
					<Select disabled={isLanguageChanging()} onChange={changeLanguage}>
						<option value="en" selected={user().language === "en"}>{t("pages.settings.account.language.english")}</option>
						<option value="fr" selected={user().language === "fr"}>{t("pages.settings.account.language.french")}</option>
					</Select>
				</div>
			</div>}
		</Show>
	</main>;
}
