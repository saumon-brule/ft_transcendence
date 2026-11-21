import { summonPopUp } from "~/components/ui/Overlay";
import { DEFAULT_ARTIST } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, onCleanup } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { Provider } from "@flex/shared";
import { summonErrorToast } from "~/components/ui/Toaster";
import "./AddArtistPopUp.scss";
import { Artist } from "~/class/Artist";

export function summonAddArtistPopUp(provider: Provider, nameHint: string = "", onNewArtist?: (newArtist: Artist) => void) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(nameHint);
		const [avatar, setAvatar] = createSignal<File | null>(null);

		const artistCreateMutation = providerClient.client.artist.create.createMutation();
		const artistUploadAvatarMutation = providerClient.client.artist.uploadAvatar.createMutation();
		const artistRemoveMutation = providerClient.client.artist.remove.createMutation();

		const avatarPreviewUrl = createMemo(() => {
			const f = avatar();
			if (!f) return null;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			try {
				const createRes = await artistCreateMutation.mutateAsync({ body: { name: name() } });
				if (createRes.status !== 201) {
					summonErrorToast(() => "An error occured during creation of the artist");
					return;
				}

				const newArtist = createRes.body;
				const uuid = newArtist.uuid;
				const curAvatar = avatar();
				if (curAvatar) {
					const uploadAvatarRes = await artistUploadAvatarMutation.mutateAsync({ params: { uuid }, body: { file: curAvatar } });
					if (uploadAvatarRes.status !== 204) {
						if (uploadAvatarRes.status === 413) summonErrorToast(() => "File to large");
						else if (uploadAvatarRes.status === 415) summonErrorToast(() => "File not supported");
						else summonErrorToast(() => "An error occured during creation of the artist");
						void artistRemoveMutation.mutate({ params: { uuid } });
						return;
					}
					newArtist.hasAvatar = true;
				}
				onNewArtist?.(Artist.fromRawObject(newArtist, provider));
				props.close();
			} catch (e) {
				console.error(e);
				summonErrorToast(() => "An error occured during creation of the artist");
			}
		};

		const isPending = () => artistCreateMutation.isPending || artistUploadAvatarMutation.isPending || artistRemoveMutation.isPending;

		return <Form class="create-artist-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Create new artist</h2>
			<div class="create-artist-info">
				<div class="create-artist-avatar-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setAvatar(e.currentTarget.files?.[0] ?? null)}
					/>
					<img src={avatarPreviewUrl() ?? DEFAULT_ARTIST} onClick={() => fileInputRef.click()}/>
				</div>
				<div class="create-artist-details">
					<TextInput placeholder="Name" class="create-artist-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<div class="create-artist-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button disabled={isPending()} type="submit">Upload</Button>
			</div>
		</Form>;
	});
}
