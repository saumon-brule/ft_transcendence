// import { Profile, updateMeSchema } from "@flex/shared";
// import { createEffect, createSignal, JSX, Show } from "solid-js";
// import { client } from "~/api/client";
// import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
// import Button from "~/components/inputs/Button";
// import Form from "~/components/inputs/Form/Form";
// import TextInput from "~/components/inputs/TextInput";
// import Toggle from "~/components/inputs/Toggle/Toggle";
// import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
// import { useTranslation } from "~/i18n/context";
// import { validateFromZod } from "~/utils/validateFromZod";

// type OnChangeEventHandler = JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>;

export default function ProfileSettings() {
// 	const profileQuery = useMeProfileQuery();
// 	const updatePictureMutation = client.users.uploadAvatar.createMutation();
// 	const { t } = useTranslation();
// 	// const [listeningPrivate, setListeningPrivate] = createSignal(false);
// 	// 	const [draft, setDraft] = createSignal<Profile | undefined>(undefined);
// 	//
// 	// 	const serverProfile = () => profileQuery.data?.status === 200 ? profileQuery.data.body : undefined;
// 	// 	const profile = () => draft() ?? serverProfile();
// 	// 	const isDirty = () => draft() !== undefined;
// 	//
// 	// 	function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
// 	// 		const base = profile();
// 	// 		if (!base) return;
// 	// 		setDraft({ ...base, [key]: value });
// 	// 	}
//
// 	const updatePicture: OnChangeEventHandler = (e) => {
// 		const file = e.target.files?.[0];
// 		if (!file) return;
// 		updatePictureMutation.mutate({
// 			body: { avatar: file },
// 		}, {
// 			onSuccess: () => {
// 				summonSuccessToast(() => (t("pages.settings.profile.profilePictureUpdated"), "test"));
// 			},
// 			onError: () => summonErrorToast(() => t("pages.settings.profile.profilePictureUpdateFail")),
// 		});
// 	};
//
// 	return <>
// 		<h1>Account</h1>
// 		<Show when={profileQuery.data ? profileQuery.data.body : undefined}>
// 			{(user) => <div class="settings-content">
// 				<div class="profile-picture" style={{ "background-image": `url(${user().avatarUrl}` }}>
// 					<label for="avatar-upload">
// 						<span>Change</span>
// 					</label>
// 					<input type="file" id="avatar-upload" accept="image/*" onChange={updatePicture} />
// 				</div>
// 				{/* <Form onSubmit={updateProfile}>
// 					<TextInput
// 						ref={(e) => usernameInput = e.htmlElement}
// 						validator={(e) => validateFromZod(updateMeSchema.shape.username, e.value)}
// 						placeholder="Username"
// 						required
// 					/>
// 					<Toggle
// 						label="Private listening"
// 						checked={listeningPrivate()}
// 						onChange={(e) => setListeningPrivate(e.currentTarget.checked)}
// 					/>
// 					<Button type="submit" disabled={updateProfileMutation.status === "loading"}>
// 						Save
// 					</Button>
// 				</Form>*/}
// 			</div>}
// 		</Show>
// 	</>;
	return <></>;
}
