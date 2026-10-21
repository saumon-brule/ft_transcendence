import { onCleanup, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { summonPasswordEditPopUp } from "./editionPopUps/passwordPopUp";
import { summonUsernameEditPopUp } from "./editionPopUps/usernamePopUp";
import { summonEmailEditPopUp } from "./editionPopUps/emailPopUp";
import { OverlayControls } from "~/components/ui/Overlay";
export default function AccountSettings() {
	const profileQuery = useMeProfileQuery();

	let usernameEditPopUpControls: OverlayControls | null = null;
	let passwordEditPopUpControls: OverlayControls | null = null;
	let emailEditPopUpControls: OverlayControls | null = null;

	onCleanup(() => {
		usernameEditPopUpControls?.close();
		passwordEditPopUpControls?.close();
		emailEditPopUpControls?.close();
	});


	return <>
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
	</>;
}
