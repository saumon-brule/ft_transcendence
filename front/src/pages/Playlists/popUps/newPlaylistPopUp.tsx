import { onMount } from "solid-js";
import { createPlaylistBodySchema } from "@flex/shared";
import { useCreatePlaylistMutation } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import Toggle from "~/components/inputs/Toggle/Toggle";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonSuccessToast } from "~/components/ui/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";
import { t } from "~/i18n/context";

export const summonNewPlaylistPopUp = (onCreated?: (playlistUuid: string) => void) => summonPopUp((popUpControls) => {
	const createPlaylist = useCreatePlaylistMutation();

	let nameInput!: HTMLInputElement;
	let privateInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		createPlaylist.mutate(
			{ body: { name: nameInput.value, private: privateInput.checked } },
			{
				onSuccess: (playlist) => {
					summonSuccessToast(() => t("toasts.playlist.created"));
					popUpControls.close();
					onCreated?.(playlist.body.uuid);
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("components.playlistCard.newPlaylist")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="playlistName" placeholder={t("pages.playlist.namePlaceholder")} type="text" validator={(e) => validateFromZod(createPlaylistBodySchema.shape.name, e.value)} required />
			<Toggle ref={(e) => privateInput = e} name="playlistPrivate" label={t("common.private")} checked={false} />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" disabled={createPlaylist.isPending}>{t("common.create")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
