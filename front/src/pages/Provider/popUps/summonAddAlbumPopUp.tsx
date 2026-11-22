import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { DEFAULT_ALBUM } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { Provider, providerContract } from "@flex/shared";
import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/feedback/UploadProgress";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import "./AddAlbumPopUp.scss";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/cards/ArtistCard";
import { X } from "lucide-solid";
import { SelectArtistMenu } from "./SelectArtistMenu";
import { Album } from "~/class/Album";
import { t } from "~/i18n/context";
import { devWarn } from "~/utils/devLog";

export function summonAddAlbumPopUp(provider: Provider, nameHint: string = "", onNewAlbum?: (newAlbum: Album) => void) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(nameHint);
		const [cover, setCover] = createSignal<File | null>(null);
		const [artists, setArtists] = createSignal<Array<Artist>>([]);

		function addArtist(artist: Artist) {
			setArtists([...artists(), artist]);
		}
		function removeArtist(artist: Artist) {
			setArtists([...artists().filter((a) => a.uuid !== artist.uuid)]);
		}

		const albumCreateMutation = providerClient.client.album.create.createMutation();
		const albumUploadCoverMutation = providerClient.client.album.uploadCover.createMutation();
		const albumRemoveMutation = providerClient.client.album.remove.createMutation();

		const [coverProgress, setCoverProgress] = createSignal(0);

		const coverPreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return null;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			let createdUuid: string | null = null;
			const failCreation = (status?: number) => {
				if (status === 413) summonErrorToast(() => t("pages.provider.popUps.fileTooLarge"));
				else if (status === 415) summonErrorToast(() => t("pages.provider.popUps.fileNotSupported"));
				else summonErrorToast(() => t("pages.provider.popUps.album.createError"));
				if (createdUuid) void albumRemoveMutation.mutate({ params: { uuid: createdUuid } });
			};

			try {
				const createRes = await settleResponse(albumCreateMutation.mutateAsync({ body: {
					name: name(),
					artistUuids: artists().map((artist) => artist.uuid),
				} }), providerContract.album.create);
				if (createRes.status !== 201) {
					failCreation(createRes.status);
					return;
				}

				const newAlbum = createRes.body;
				const uuid = newAlbum.uuid;
				createdUuid = uuid;

				const curCover = cover();
				if (curCover) {
					const uploadCoverRes = await settleResponse(albumUploadCoverMutation.mutateAsync({
						params: { uuid },
						body: { file: curCover },
						onUploadProgress: setCoverProgress,
					}), providerContract.album.uploadCover);
					if (uploadCoverRes.status !== 204) {
						failCreation(uploadCoverRes.status);
						return;
					}
					newAlbum.hasCover = true;
				}
				onNewAlbum?.(Album.fromRawObject(newAlbum, provider));
				props.close();
			} catch (e) {
				devWarn(e);
				failCreation();
			}
		};

		const isPending = () => albumCreateMutation.isPending || albumUploadCoverMutation.isPending || albumRemoveMutation.isPending;

		return <Form class="create-album-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >{t("pages.provider.popUps.album.addTitle")}</h2>
			<div class="create-album-info">
				<div class="create-album-cover-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<img src={coverPreviewUrl() ?? DEFAULT_ALBUM} onClick={() => fileInputRef.click()}/>
				</div>
				<div class="create-album-details">
					<TextInput placeholder={t("pages.provider.popUps.namePlaceholder")} class="create-album-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<div class="create-album-artists" >
				<div class="artist">
					<SelectArtistMenu exclude={artists()} provider={provider} addArtist={addArtist}/>
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
			<div class="create-album-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>{t("common.cancel")}</Button>
				<Button disabled={isPending()} type="submit">{t("pages.provider.popUps.upload")}</Button>
			</div>
		</Form>;
	});
}
