import { Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { OverlayControls } from "~/components/ui/Overlay";
import { onCleanup } from "solid-js";

import "./Settings.scss";
import { summonPasswordEditPopUp } from "./editionPopUps/passwordPopUp";
import { summonUsernameEditPopUp } from "./editionPopUps/usernamePopUp";
import { summonEmailEditPopUp } from "./editionPopUps/emailPopUp";

export default function Settings() {
	// const [listeningPrivate, setListeningPrivate] = createSignal(false);

	const profileQuery = useMeProfileQuery();

	// function updatePicture(e: Event) {
	// 	const file = (e.target as HTMLInputElement).files?.[0];
	// 	if (!file) return;
	// 	updatePictureMutation.mutate({
	// 		body: { avatar: file },
	// 	}, {
	// 		onSuccess: () => {
	// 			avatarUpdated();
	// 			summonSuccessToast("Avatar updated");
	// 		},
	// 		onError: () => summonErrorToast("Unable to update avatar"),
	// 	});
	// }

	let usernameEditPopUpControls: OverlayControls | null = null;
	let passwordEditPopUpControls: OverlayControls | null = null;
	let emailEditPopUpControls: OverlayControls | null = null;

	onCleanup(() => {
		usernameEditPopUpControls?.close();
		passwordEditPopUpControls?.close();
		emailEditPopUpControls?.close();
	});

	return <div class="page" id="settings">
		<h1>Account</h1>
		<Show when={profileQuery.data ? profileQuery.data.body : undefined}>
			{(user) => <div class="settings-content">
				<div class="setting-field">
					<div class="setting-field-title">
						<h3>Username</h3>
						<Button variant="link" onClick={(e) => {
							e.preventDefault();
							usernameEditPopUpControls = summonUsernameEditPopUp(() => usernameEditPopUpControls = null);
						}} >edit</Button>
					</div>
					<div class="setting-field-value">{user().username}</div>
				</div>
				<Show when={/* authMethod === INTRA_OAUTH */ true}>
					<div class="setting-field">
						<div class="setting-field-title">
							<h3>Password<span class="secondary-info">set</span></h3>
							<Button variant="link" onClick={(e) => {
								e.preventDefault();
								passwordEditPopUpControls = summonPasswordEditPopUp(() => passwordEditPopUpControls = null);
							}} >edit</Button>
						</div>
					</div>
				</Show>
				<div class="setting-field">
					<div class="setting-field-title">
						<h3>Email</h3>
						<Button variant="link" onClick={(e) => {
							e.preventDefault();
							emailEditPopUpControls = summonEmailEditPopUp(() => emailEditPopUpControls = null);
						}} >edit</Button>
					</div>
					<div class="setting-field-value">{user().email}</div>
				</div>
			</div>}
		</Show>
	</div>;
}
