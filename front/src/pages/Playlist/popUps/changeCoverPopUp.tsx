import { createSignal, onCleanup, Show } from "solid-js";
import { MAX_SIZE } from "@flex/shared";
import { useDeletePlaylistCoverMutation, useUploadPlaylistCoverMutation } from "~/api/queryHooks/playlist";
import Button from "~/components/inputs/Button";
import Form from "~/components/inputs/Form/Form";
import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { playlistCoverUrl } from "~/utils/playlistCover";
import ProgressRing from "~/components/ui/feedback/ProgressRing";
import { t } from "~/i18n/context";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const summonChangeCoverPopUp = (playlist: { uuid: string; name: string }) => summonPopUp((popUpControls) => {
	const uploadCover = useUploadPlaylistCoverMutation();
	const deleteCover = useDeletePlaylistCoverMutation();

	const [file, setFile] = createSignal<File | null>(null);
	const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
	const [uploadProgress, setUploadProgress] = createSignal(0);

	function setPreview(url: string | null) {
		const previous = previewUrl();
		if (previous) URL.revokeObjectURL(previous);
		setPreviewUrl(url);
	}

	onCleanup(() => setPreview(null));

	function handleFileChange(e: Event & { currentTarget: HTMLInputElement }) {
		const selected = e.currentTarget.files?.[0];
		if (!selected) return;

		if (!ACCEPTED_TYPES.includes(selected.type)) {
			summonErrorToast(t("pages.playlist.coverPopUp.invalidType"));
			return;
		}
		if (selected.size > MAX_SIZE) {
			summonErrorToast(t("toasts.playlist.imageTooLarge"));
			return;
		}

		setFile(selected);
		setPreview(URL.createObjectURL(selected));
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const selected = file();
		if (!selected) return;

		setUploadProgress(0);
		uploadCover.mutate(
			{ params: { uuid: playlist.uuid }, body: { cover: selected }, onUploadProgress: setUploadProgress },
			{ onSuccess: () => popUpControls.close() },
		);
	}

	function handleRemove() {
		deleteCover.mutate(
			{ params: { uuid: playlist.uuid } },
			{ onSuccess: () => popUpControls.close() },
		);
	}

	const busy = () => uploadCover.isPending || deleteCover.isPending;

	return <Form onSubmit={handleSubmit}>
		<h2>{t("pages.playlist.changeCover")}</h2>
		<div class="pop-up-inputs cover-pop-up-inputs">
			<div class="cover-preview-box">
				<img class="cover-preview" src={previewUrl() ?? playlistCoverUrl(playlist.uuid)} alt={t("pages.playlist.coverPopUp.preview")} />
				<Show when={uploadCover.isPending}>
					<ProgressRing value={uploadProgress()}/>
				</Show>
			</div>
			<input type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleFileChange} />
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="button" onClick={handleRemove} variant="danger" size="md" disabled={busy()}>{t("pages.playlist.coverPopUp.remove")}</Button>
			<Button type="submit" size="md" disabled={busy() || file() === null}>
				<Show when={uploadCover.isPending} fallback={t("common.save")}>{t("common.saving")}</Show>
			</Button>
		</div>
	</Form>;
}, { customClass: "provider-pop-up" });
