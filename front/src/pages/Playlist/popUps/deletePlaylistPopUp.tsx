import { useDeletePlaylistMutation } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/Overlay";
import { t } from "~/i18n/context";

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
		<h2>{t("pages.playlist.deletePopUp.title")}</h2>
		<div class="pop-up-inputs">
			<p>{t("pages.playlist.deletePopUp.confirm.begin")}<strong>{playlist.name}</strong>{t("pages.playlist.deletePopUp.confirm.end")}</p>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" variant="danger" disabled={deletePlaylist.isPending}>{t("common.delete")}</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
