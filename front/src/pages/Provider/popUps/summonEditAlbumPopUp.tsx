import { summonPopUp } from "~/components/ui/Overlay";
import { DEFAULT_ALBUM } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import { Undo2, X } from "lucide-solid";
import { SelectArtistMenu } from "./SelectArtistMenu";
import { Album } from "~/class/Album";
import { AlbumCover } from "~/components/ui/AlbumCard";
import "./EditAlbumPopUp.scss";

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

		const coverPreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return f;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			try {
				const createRes = await albumUpdateMutation.mutateAsync({ params: { uuid: album.uuid },
					body: {
						name: name(),
						artistUuids: artists().map((artist) => artist.uuid),
					} });
				if (createRes.status !== 200) {
					summonErrorToast(() => "An error occured during the edit of the artist");
					return;
				}

				setNewAlbum?.(Album.fromRawObject(createRes.body, album.provider));

				const curCover = cover();
				if (curCover === null) {
					const removeCoverRes = await albumRemoveCoverMutation.mutateAsync({ params: { uuid: album.uuid } });
					if (removeCoverRes.status !== 204) {
						summonErrorToast(() => "An error occured during remove of the cover");
						return;
					}
				} else if (curCover !== undefined) {
					const uploadCoverRes = await albumUploadCoverMutation.mutateAsync({ params: { uuid: album.uuid }, body: { file: curCover } });
					if (uploadCoverRes.status !== 204) {
						if (uploadCoverRes.status === 413) summonErrorToast(() => "File to large");
						else if (uploadCoverRes.status === 415) summonErrorToast(() => "File not supported");
						else summonErrorToast(() => "An error occured during upload of the cover");
						return;
					}
				}
				props.close();
			} catch (e) {
				console.error(e);
				summonErrorToast(() => "An error occured during creation of the artist");
			}
		};

		const isPending = () => albumUpdateMutation.isPending || albumUploadCoverMutation.isPending || albumRemoveCoverMutation.isPending;

		return <Form class="edit-album-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Create new album</h2>
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
						<Button icon size="sm" variant="ghost" onClick={() => setCover(undefined)} ><Undo2 size={20}/></Button>
					</Show>
				</div>
				<div class="edit-album-details">
					<TextInput placeholder="Name" class="edit-album-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
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
			<div class="edit-album-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button disabled={isPending()} type="submit">Edit</Button>
			</div>
		</Form>;
	});
}
