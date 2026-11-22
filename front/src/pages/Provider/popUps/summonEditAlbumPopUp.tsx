import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/feedback/UploadProgress";
import { providerContract } from "@flex/shared";
import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { DEFAULT_ALBUM } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/cards/ArtistCard";
import { Undo2, X } from "lucide-solid";
import { SelectArtistMenu } from "./SelectArtistMenu";
import { Album } from "~/class/Album";
import { AlbumCover } from "~/components/ui/cards/AlbumCard";
import "./EditAlbumPopUp.scss";
import { t } from "~/i18n/context";
import { devWarn } from "~/utils/devLog";

export function summonEditAlbumPopUp(album: Album, setNewAlbum?: (newAlbum: Album) => void) {
	const providerClient = getProviderClient(album.provider.address, album.provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(album.name);
		const [cover, setCover] = createSignal<File | null | undefined>(undefined);
		const [artists, setArtists] = createSignal<Array<Artist>>(album.artists);

		function addArtist(artist: Artist) {
			setArtists([...artists(), artist]);
		}
		function removeArtist(artist: Artist) {
			setArtists([...artists().filter((a) => a.uuid !== artist.uuid)]);
		}

		const albumUpdateMutation = providerClient.client.album.update.createMutation();
		const albumUploadCoverMutation = providerClient.client.album.uploadCover.createMutation();
		const albumRemoveCoverMutation = providerClient.client.album.removeCover.createMutation();

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
			let updated: Parameters<typeof Album.fromRawObject>[0] | null = null;
			const notifyUpdate = () => {
				if (updated) setNewAlbum?.(Album.fromRawObject(updated, album.provider));
			};
			const failEdit = (message: string, status?: number) => {
				if (status === 413) summonErrorToast(() => t("pages.provider.popUps.fileTooLarge"));
				else if (status === 415) summonErrorToast(() => t("pages.provider.popUps.fileNotSupported"));
				else summonErrorToast(() => message);
				notifyUpdate();
			};

			try {
				const updateRes = await settleResponse(albumUpdateMutation.mutateAsync({ params: { uuid: album.uuid },
					body: {
						name: name(),
						artistUuids: artists().map((artist) => artist.uuid),
					} }), providerContract.album.update);
				if (updateRes.status !== 200) {
					failEdit(t("pages.provider.popUps.album.editError"), updateRes.status);
					return;
				}
				updated = updateRes.body;

				const curCover = cover();
				if (curCover === null) {
					const removeCoverRes = await settleResponse(
						albumRemoveCoverMutation.mutateAsync({ params: { uuid: album.uuid } }),
						providerContract.album.removeCover,
					);
					if (removeCoverRes.status !== 204) {
						failEdit(t("pages.provider.popUps.coverRemoveError"), removeCoverRes.status);
						return;
					}
					updated.hasCover = false;
				} else if (curCover !== undefined) {
					const uploadCoverRes = await settleResponse(albumUploadCoverMutation.mutateAsync({
						params: { uuid: album.uuid },
						body: { file: curCover },
						onUploadProgress: setCoverProgress,
					}), providerContract.album.uploadCover);
					if (uploadCoverRes.status !== 204) {
						failEdit(t("pages.provider.popUps.coverUploadError"), uploadCoverRes.status);
						return;
					}
					updated.hasCover = true;
				}
				notifyUpdate();
				props.close();
			} catch (e) {
				devWarn(e);
				failEdit(t("pages.provider.popUps.album.editError"));
			}
		};

		const isPending = () => albumUpdateMutation.isPending || albumUploadCoverMutation.isPending || albumRemoveCoverMutation.isPending;

		return <Form class="edit-album-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >{t("pages.provider.popUps.album.editTitle")}</h2>
			<div class="edit-album-info">
				<div class="edit-album-cover-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<Show when={coverPreviewUrl() !== undefined} fallback={<AlbumCover album={album} onClick={() => fileInputRef.click()}/>}>
						<img src={coverPreviewUrl() ?? DEFAULT_ALBUM} onClick={() => fileInputRef.click()}/>
					</Show>
					<Show when={cover() === undefined && album.hasCover} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(null)} class="remove-cover-button"><X size={20}/></Button>
					</Show>
					<Show when={cover() !== undefined} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(undefined)} ><Undo2 size={20}/></Button>
					</Show>
				</div>
				<div class="edit-album-details">
					<TextInput placeholder={t("pages.provider.popUps.namePlaceholder")} class="edit-album-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<div class="edit-album-artists" >
				<div class="artist">
					<SelectArtistMenu exclude={artists()} provider={album.provider} addArtist={addArtist}/>
				</div>
				<div class="album-artists-scrollable">
					<For each={artists()} >
						{(artist) => <div class="artist">
							<ArtistAvatar artist={artist}/>
							<span>{artist.name}</span>
							<Button type="button" icon variant="danger" onClick={() => removeArtist(artist)}><X size={18}/></Button>
						</div>}
					</For>
				</div>
			</div>
			<Show when={albumUploadCoverMutation.isPending}>
				<UploadProgress label={t("pages.provider.popUps.coverUpload")} value={coverProgress()}/>
			</Show>
			<div class="edit-album-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>{t("common.cancel")}</Button>
				<Button disabled={isPending()} type="submit">{t("common.edit")}</Button>
			</div>
		</Form>;
	});
}
