
import { /* createSignal,*/ JSX, onCleanup, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { queryClient } from "~/api/queryClient";
import { ClientInferResponses } from "@ts-rest/core";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import Button from "~/components/inputs/Button";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { useTranslation } from "~/i18n/context";

import "./ProfileSettings.scss";
import { OverlayControls } from "~/components/ui/Overlay";
import { summonUsernameEditPopUp } from "./editionPopUps/usernamePopUp";
import MusicBars from "~/components/graphics/icons/MusicBars";
import { MAX_SIZE, serverContract } from "@flex/shared";

type UserMeResponse = ClientInferResponses<typeof serverContract.users.me, 200>;
type OnChangeEventHandler = JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>;

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

export default function ProfileSettings() {
	const profileQuery = useMeProfileQuery();
	const updatePictureMutation = client.users.uploadAvatar.createMutation();
	const { t } = useTranslation();
	// const [listeningPrivate, setListeningPrivate] = createSignal(false);
	// const [draft, setDraft] = createSignal<ReturnType<typeof serverProfile> | undefined>(undefined);

	// 	const serverProfile = () => profileQuery.data?.status === 200 ? profileQuery.data.body : undefined;
	// 	const profile = () => draft() ?? serverProfile();
	// 	const isDirty = () => draft() !== undefined;
	//
	// 	function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
	// 		const base = profile();
	// 		if (!base) return;
	// 		setDraft({ ...base, [key]: value });
	// 	}

	const updatePicture: OnChangeEventHandler = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_SIZE) {
			summonErrorToast(() => t("pages.settings.profile.profilePictureUpdateToolarge"));
			return;
		}
		updatePictureMutation.mutate({
			body: { avatar: file },
		}, {
			onSuccess: () => {
				queryClient.setQueryData<UserMeResponse>(queryKeys.users.me(), (old) => {
					if (!old) return old;
					return {
						...old,
						body: { ...old.body, avatarUpdatedAt: new Date() },
					};
				});
				summonSuccessToast(() => t("pages.settings.profile.profilePictureUpdated"));
			},
			onError: (e) => {
				if (e.status === 413) {
					summonErrorToast(() => t("pages.settings.profile.profilePictureUpdateToolarge"));
				} else {
					summonErrorToast(() => t("pages.settings.profile.profilePictureUpdateFail"));
				}
			},
		});
	};

	let usernameEditPopUpControls: OverlayControls | null = null;

	onCleanup(() => {
		usernameEditPopUpControls?.close();
	});


	return <main class="profile-settings">
		<Show when={profileQuery.data?.body} keyed>
			{(user) => <div class="profile-settings-content">
				{/* <img src={user().avatarUrl} alt="Profile picture" />*/}
				<div class="profile-picture" style={{ "background-image": `url(${user.avatarUrl}` }}>
					<label for="avatar-upload">
						<span>Change</span>
					</label>
					<input type="file" id="avatar-upload" accept="image/*" onChange={updatePicture} />
				</div>
				<div class="header-info">
					<div class="username">
						<h2>
							{user.username}
						</h2>
						<Button size="sm" onClick={(e) => {
							e.preventDefault();
							usernameEditPopUpControls = summonUsernameEditPopUp(() => usernameEditPopUpControls = null);
						}} >
							{t("pages.settings.edit")}
						</Button>
					</div>
					<div class="user-stats">
						<div class="stat">Member since {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
						<div class="separator" />
						<div class="stat">{user._count.ownedProviders} owned providers</div>
						<div class="separator" />
						<div class="stat">{user._count.ownedPlaylists} playlists</div>
					</div>
					<Show when={user.currentlyListening && user.listeningUntil && toDate(user.listeningUntil) > new Date()}>
						<div class="listening"><MusicBars />Listening to « {user.currentlyListening!.title} » - {user.currentlyListening!.artist}</div>
					</Show>
				</div>
			</div>}
		</Show>
	</main>;
}
