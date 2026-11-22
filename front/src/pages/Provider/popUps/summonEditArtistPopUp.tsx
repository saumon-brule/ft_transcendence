import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/feedback/UploadProgress";
import { providerContract } from "@flex/shared";
import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { DEFAULT_ARTIST } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/cards/ArtistCard";
import { Undo2, X } from "lucide-solid";
import "./EditArtistPopUp.scss";
import { t } from "~/i18n/context";
import { devWarn } from "~/utils/devLog";
import { invalidateProviderCatalog } from "~/api/queryHooks/providerManageCatalog";

export function summonEditArtistPopUp(artist: Artist, setNewArtist?: (newArtist: Artist) => void) {
	const providerClient = getProviderClient(artist.provider.address, artist.provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(artist.name);
		const [cover, setCover] = createSignal<File | null | undefined>(undefined);

		const artistUpdateMutation = providerClient.client.artist.update.createMutation();
		const artistUploadCoverMutation = providerClient.client.artist.uploadAvatar.createMutation();
		const artistRemoveCoverMutation = providerClient.client.artist.removeAvatar.createMutation();

		const [coverProgress, setCoverProgress] = createSignal(0);

		const coverPreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return f;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			let updated: Parameters<typeof Artist.fromRawObject>[0] | null = null;
			const notifyUpdate = () => {
				if (!updated) return;
				invalidateProviderCatalog(artist.provider);
				setNewArtist?.(Artist.fromRawObject(updated, artist.provider));
			};
			const failEdit = (message: string, status?: number) => {
				if (status === 413) summonErrorToast(() => t("pages.provider.popUps.fileTooLarge"));
				else if (status === 415) summonErrorToast(() => t("pages.provider.popUps.fileNotSupported"));
				else summonErrorToast(() => message);
				notifyUpdate();
			};

			try {
				const updateRes = await settleResponse(
					artistUpdateMutation.mutateAsync({ params: { uuid: artist.uuid }, body: { name: name() } }),
					providerContract.artist.update,
				);
				if (updateRes.status !== 200) {
					failEdit(t("pages.provider.popUps.artist.editError"), updateRes.status);
					return;
				}
				updated = updateRes.body;

				const curCover = cover();
				if (curCover === null) {
					const removeCoverRes = await settleResponse(
						artistRemoveCoverMutation.mutateAsync({ params: { uuid: artist.uuid } }),
						providerContract.artist.removeAvatar,
					);
					if (removeCoverRes.status !== 204) {
						failEdit(t("pages.provider.popUps.avatarRemoveError"), removeCoverRes.status);
						return;
					}
					updated.hasAvatar = false;
				} else if (curCover !== undefined) {
					const uploadCoverRes = await settleResponse(artistUploadCoverMutation.mutateAsync({
						params: { uuid: artist.uuid },
						body: { file: curCover },
						onUploadProgress: setCoverProgress,
					}), providerContract.artist.uploadAvatar);
					if (uploadCoverRes.status !== 204) {
						failEdit(t("pages.provider.popUps.avatarUploadError"), uploadCoverRes.status);
						return;
					}
					updated.hasAvatar = true;
				}
				notifyUpdate();
				props.close();
			} catch (e) {
				devWarn(e);
				failEdit(t("pages.provider.popUps.artist.editError"));
			}
		};

		const isPending = () => artistUpdateMutation.isPending || artistUploadCoverMutation.isPending || artistRemoveCoverMutation.isPending;

		return <Form class="edit-artist-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >{t("pages.provider.popUps.artist.editTitle")}</h2>
			<div class="edit-artist-info">
				<div class="edit-artist-avatar-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<Show when={coverPreviewUrl() !== undefined} fallback={<ArtistAvatar artist={artist} onClick={() => fileInputRef.click()}/>}>
						<img src={coverPreviewUrl() ?? DEFAULT_ARTIST} onClick={() => fileInputRef.click()}/>
					</Show>
					<Show when={cover() === undefined && artist.hasAvatar} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(null)} class="remove-cover-button"><X/></Button>
					</Show>
					<Show when={cover() !== undefined} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(undefined)} ><Undo2/></Button>
					</Show>
				</div>
				<div class="edit-artist-details">
					<TextInput placeholder={t("pages.provider.popUps.namePlaceholder")} class="edit-artist-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<Show when={artistUploadCoverMutation.isPending}>
				<UploadProgress label={t("pages.provider.popUps.avatarUpload")} value={coverProgress()}/>
			</Show>
			<div class="edit-artist-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>{t("common.cancel")}</Button>
				<Button disabled={isPending()} type="submit">{t("common.edit")}</Button>
			</div>
		</Form>;
	});
}
