import { summonPopUp } from "~/components/ui/Overlay";
import { DEFAULT_ALBUM } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { Provider } from "@flex/shared";
import { summonErrorToast } from "~/components/ui/Toaster";
import "./AddAlbumPopUp.scss";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import { X } from "lucide-solid";
import { SelectArtistMenu } from "./SelectArtistMenu";

export function summonAddAlbumPopUp(provider: Provider) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal("");
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

		const coverPreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return null;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			try {
				const createRes = await albumCreateMutation.mutateAsync({ body: {
					name: name(),
					artistUuids: artists().map((artist) => artist.uuid),
				} });
				if (createRes.status !== 201) {
					summonErrorToast(() => "An error occured during creation of the artist");
					return;
				}

				const uuid = createRes.body.uuid;
				const curCover = cover();
				if (!curCover) return;

				const uploadCoverRes = await albumUploadCoverMutation.mutateAsync({ params: { uuid }, body: { file: curCover } });
				if (uploadCoverRes.status !== 204) {
					if (uploadCoverRes.status === 413) summonErrorToast(() => "File to large");
					else if (uploadCoverRes.status === 415) summonErrorToast(() => "File not supported");
					else summonErrorToast(() => "An error occured during creation of the artist");
					void albumRemoveMutation.mutate({ params: { uuid } });
					return;
				}
				props.close();
			} catch (e) {
				console.error(e);
				summonErrorToast(() => "An error occured during creation of the artist");
			}
		};

		const isPending = () => albumCreateMutation.isPending || albumUploadCoverMutation.isPending || albumRemoveMutation.isPending;

		return <Form class="create-album-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Create new album</h2>
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
					<TextInput placeholder="Name" class="create-album-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
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
			<div class="create-album-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button disabled={isPending()} type="submit">Upload</Button>
			</div>
		</Form>;
	});
}
