import { useDeletePlaylistMutation } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";

export const summonDeletePlaylistPopUp = (playlist: { uuid: string; name: string }, onDeleted?: () => void) => summonPopUp((popUpControls) => {
	const deletePlaylist = useDeletePlaylistMutation();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		deletePlaylist.mutate(
			{ params: { uuid: playlist.uuid } },
			{
				onSuccess: () => {
					popUpControls.close();
					onDeleted?.();
				},
			},
		);
	}

	return <Form onSubmit={handleSubmit}>
		<h2>Delete playlist</h2>
		<div class="pop-up-inputs">
			<p>Are you sure you want to delete <strong>{playlist.name}</strong>? This action cannot be undone.</p>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" variant="danger" disabled={deletePlaylist.isPending}>Delete</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
