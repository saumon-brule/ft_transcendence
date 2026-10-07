import { createEffect, createSignal, Show } from "solid-js";
import { client } from "~/api/client";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useProfile } from "~/components/context/ProfileContext";
import { authContract, changePasswordSchema, updateMeSchema } from "@flex/shared";
import { validateFromZod } from "~/utils/validateFromZod";

import "./Settings.scss";
import TextInput from "~/components/ui/TextInput";
import Form from "~/components/ui/Form/Form";
import Button from "~/components/ui/Button";
import Toggle from "~/components/ui/Toggle/Toggle";
import { env } from "~/env";

export default function Settings() {
	const [me, { update, avatarUpdated }] = useProfile();
	const [listeningPrivate, setListeningPrivate] = createSignal(false);
	const updateProfileMutation = client.users.updateMe.createMutation();
	const updatePictureMutation = client.users.uploadAvatar.createMutation();
	const requestEmailResetMutation = client.auth.requestEmailReset.createMutation();
	const changePasswordMutation = client.auth.changePassword.createMutation();
	let usernameInput!: HTMLInputElement;
	let emailPasswordInput!: HTMLInputElement;
	let newEmailInput!: HTMLInputElement;
	let oldPasswordInput!: HTMLInputElement;
	let newPasswordInput!: HTMLInputElement;

	createEffect(() => {
		const profile = me.profile;
		if (!profile) return;
		usernameInput.value = profile.username;
		setListeningPrivate(profile.listeningPrivate);
	});

	function updatePicture(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		updatePictureMutation.mutate({
			body: { avatar: file },
		}, {
			onSuccess: () => {
				avatarUpdated();
				summonSuccessToast("Avatar updated");
			},
			onError: () => summonErrorToast("Unable to update avatar"),
		});
	}

	function updateProfile(e: SubmitEvent) {
		e.preventDefault();
		updateProfileMutation.mutate({
			body: {
				username: usernameInput.value,
				listeningPrivate: listeningPrivate(),
			},
		},
		{
			onSuccess: (response) => {
				update(response.body);
				summonSuccessToast("Settings updated");
			},
			onError: () => summonErrorToast("Unable to update settings"),
		});
	}

	function requestEmailUpdate(e: SubmitEvent) {
		e.preventDefault();
		console.log(newEmailInput.value);
		requestEmailResetMutation.mutate({
			body: {
				password: emailPasswordInput.value,
				newEmail: newEmailInput.value,
			},
		}, {
			onSuccess: () => summonSuccessToast("A confirmation email has been sent"),
			onError: () => summonErrorToast("Unable to update email"),
		});
	}

	function changePassword(e: SubmitEvent) {
		e.preventDefault();
		changePasswordMutation.mutate({
			body: {
				oldPassword: oldPasswordInput.value,
				newPassword: newPasswordInput.value,
			},
		}, {
			onSuccess: () => summonSuccessToast("Password updated"),
			onError: () => summonErrorToast("Unable to update password"),
		});
	}

	return <div class="page" id="settings">
		<h1>Settings</h1>
		<Show when={me.profile}>
			{(user) => <div class="settings-content">
				<section class="settings-section">
					<h2>Profile</h2>
					<div class="profile-picture" style={{ "background-image": `url(${env.VITE_API_URL}/users/${user().uuid}/avatar?v=${me.avatarVersion})` }}>
						<label for="avatar-upload">
							<span>Change</span>
						</label>
						<input type="file" id="avatar-upload" accept="image/*" onChange={(e) => updatePicture(e)} />
					</div>

					<Form onSubmit={updateProfile}>
						<TextInput
							ref={(e) => usernameInput = e.htmlElement}
							validator={(e) => validateFromZod(updateMeSchema.shape.username, e.value)}
							placeholder="Username"
							required
						/>
						<Toggle
							label="Private listening"
							checked={listeningPrivate()}
							onChange={(e) => setListeningPrivate(e.currentTarget.checked)}
						/>
						<Button type="submit" disabled={updateProfileMutation.status === "loading"}>
							Save
						</Button>
					</Form>
				</section>

				<section class="settings-section">
					<h2>Update email</h2>
					<Form onSubmit={requestEmailUpdate}>
						<TextInput
							ref={(e) => emailPasswordInput = e.htmlElement}
							type="password"
							validator={(e) => validateFromZod(authContract.requestEmailReset.body.shape.password, e.value)}
							placeholder="Current password"
							required
						/>
						<TextInput
							ref={(e) => newEmailInput = e.htmlElement}
							type="email"
							validator={(e) => validateFromZod(authContract.requestEmailReset.body.shape.newEmail, e.value)}
							placeholder="New email"
							required
						/>
						<Button type="submit" disabled={requestEmailResetMutation.status === "loading"}>Update email</Button>
					</Form>
				</section>

				<section class="settings-section">
					<h2>Update password</h2>
					<Form onSubmit={changePassword}>
						<TextInput
							ref={(e) => oldPasswordInput = e.htmlElement}
							type="password"
							validator={(e) => validateFromZod(changePasswordSchema.shape.oldPassword, e.value)}
							placeholder="Current password"
							required
						/>
						<TextInput
							ref={(e) => newPasswordInput = e.htmlElement}
							type="password"
							validator={(e) => validateFromZod(changePasswordSchema.shape.newPassword, e.value)}
							placeholder="New password"
							required
						/>
						<TextInput
							type="password"
							validator={(e) => e.value !== newPasswordInput.value && "Passwords do not match"}
							placeholder="Confirm new password"
							required
						/>
						<Button type="submit" disabled={changePasswordMutation.status === "loading"}>Update password</Button>
					</Form>
				</section>
			</div>}
		</Show>
	</div>;
}
