import { onMount } from "solid-js";
import { createPlaylistBodySchema } from "@flex/shared";
import { useRenamePlaylistMutation } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { summonPopUp } from "~/components/ui/Overlay";
import { validateFromZod } from "~/utils/validateFromZod";
import { t } from "~/i18n/context";

export const summonRenamePlaylistPopUp = (playlist: { uuid: string; name: string }) => summonPopUp((popUpControls) => {
	const renamePlaylist = useRenamePlaylistMutation();

	let nameInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const name = nameInput.value.trim();
		if (name === playlist.name) {
			popUpControls.close();
			return;
		}

		renamePlaylist.mutate(
			{ params: { uuid: playlist.uuid }, body: { name } },
			{ onSuccess: () => popUpControls.close() },
		);
	}

	onMount(() => {
		nameInput.focus();
		nameInput.select();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.playlist.renamePopUp.title")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="playlistName" value={playlist.name} placeholder={t("pages.playlist.namePlaceholder")} type="text" validator={(e) => validateFromZod(createPlaylistBodySchema.shape.name, e.value)} required />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" disabled={renamePlaylist.isPending}>{t("common.save")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
