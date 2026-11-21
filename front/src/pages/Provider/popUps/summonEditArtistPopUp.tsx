import { summonPopUp } from "~/components/ui/Overlay";
import { DEFAULT_ALBUM } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { summonErrorToast } from "~/components/ui/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import { Undo2, X } from "lucide-solid";
import "./EditArtistPopUp.scss";

export function summonEditArtistPopUp(artist: Artist, setNewArtist: (newArtist: Artist) => void = () => {}) {
	const providerClient = getProviderClient(artist.provider.address, artist.provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(artist.name);
		const [cover, setCover] = createSignal<File | null | undefined>(undefined);

		const artistUpdateMutation = providerClient.client.artist.update.createMutation();
		const artistUploadCoverMutation = providerClient.client.artist.uploadAvatar.createMutation();
		const artistRemoveCoverMutation = providerClient.client.artist.removeAvatar.createMutation();

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
				const createRes = await artistUpdateMutation.mutateAsync({ params: { uuid: artist.uuid }, body: { name: name() } });
				if (createRes.status !== 200) {
					summonErrorToast(() => "An error occured during the edit of the artist");
					return;
				}

				setNewArtist(Artist.fromRawObject(createRes.body, artist.provider));

				const curCover = cover();
				if (curCover === null) {
					const removeCoverRes = await artistRemoveCoverMutation.mutateAsync({ params: { uuid: artist.uuid } });
					if (removeCoverRes.status !== 204) {
						summonErrorToast(() => "An error occured during remove of the cover");
						return;
					}
				} else if (curCover !== undefined) {
					const uploadCoverRes = await artistUploadCoverMutation.mutateAsync({ params: { uuid: artist.uuid }, body: { file: curCover } });
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

		const isPending = () => artistUpdateMutation.isPending || artistUploadCoverMutation.isPending || artistRemoveCoverMutation.isPending;

		return <Form class="edit-artist-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Create new artist</h2>
			<div class="edit-artist-info">
				<div class="edit-artist-cover-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<Show when={coverPreviewUrl() !== undefined} fallback={<ArtistAvatar artist={artist} onClick={() => fileInputRef.click()}/>}>
						<img src={coverPreviewUrl() ?? DEFAULT_ALBUM} onClick={() => fileInputRef.click()}/>
					</Show>
					<Show when={cover() === undefined && artist.hasAvatar} >
						<button type="button" onClick={() => setCover(null)} class="remove-cover-button"><X/></button>
					</Show>
					<Show when={cover() !== undefined} >
						<button onClick={() => setCover(undefined)} ><Undo2/></button>
					</Show>
				</div>
				<div class="edit-artist-details">
					<TextInput placeholder="Name" class="edit-artist-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<div class="edit-artist-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button disabled={isPending()} type="submit">Edit</Button>
			</div>
		</Form>;
	});
}
