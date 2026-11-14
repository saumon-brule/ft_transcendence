import { onMount } from "solid-js";
import { createPlaylistBodySchema } from "@flex/shared";
import { useCreatePlaylist } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import Toggle from "~/components/inputs/Toggle/Toggle";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonSuccessToast } from "~/components/ui/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";

export const summonNewPlaylistPopUp = (onCreated?: (playlistUuid: string) => void) => summonPopUp((popUpControls) => {
	const createPlaylist = useCreatePlaylist();

	let nameInput!: HTMLInputElement;
	let privateInput!: HTMLInputElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		createPlaylist.mutate(
			{ name: nameInput.value, private: privateInput.checked },
			{
				onSuccess: (playlist) => {
					summonSuccessToast(() => "Playlist created");
					popUpControls.close();
					onCreated?.(playlist.uuid);
				},
			},
		);
	}

	onMount(() => {
		nameInput.focus();
	});

	return <Form onSubmit={handleSubmit}>
		<h2>New playlist</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} name="playlistName" placeholder="My playlist" type="text" validator={(e) => validateFromZod(createPlaylistBodySchema.shape.name, e.value)} required />
			<Toggle ref={(e) => privateInput = e} name="playlistPrivate" label="Private" checked={false} />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" disabled={createPlaylist.isPending}>Create</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
