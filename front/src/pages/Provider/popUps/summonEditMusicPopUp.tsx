import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/UploadProgress";
import { providerContract } from "@flex/shared";
import { summonPopUp } from "~/components/ui/Overlay";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { Undo2, X } from "lucide-solid";
import { summonErrorToast } from "~/components/ui/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import { SelectAlbumMenu } from "./SelectAlbumMenu";
import { SelectArtistMenu } from "./SelectArtistMenu";
import { AlbumCover } from "~/components/ui/AlbumCard";
import { Music } from "~/class/Music";
import MusicCover from "~/components/ui/MusicCover";
import { Album } from "~/class/Album";
import "./EditMusicPopUp.scss";
import { DEFAULT_COVER } from "~/utils/imageFallback";

export function summonEditMusicPopUp(music: Music, setNewMusic?: (newMusic: Music) => void) {
	const providerClient = getProviderClient(music.provider.address, music.provider.uuid);
	return summonPopUp((props) => {
		const [title, setTitle] = createSignal(music.name);
		const [publishedDate, setPublishedDate] = createSignal<Date | null>(music.publishedAt);
		const [cover, setCover] = createSignal<File | null | undefined>(undefined);
		const [artists, setArtists] = createSignal(music.artists);
		const [album, setAlbum] = createSignal<Album | null>(music.album);

		const musicUpdateMutation = providerClient.client.music.update.createMutation();
		const musicUploadCoverMutation = providerClient.client.music.uploadCover.createMutation();
		const musicRemoveCoverMutation = providerClient.client.music.removeCover.createMutation();

		const [coverProgress, setCoverProgress] = createSignal(0);

		function addArtist(artist: Artist) {
			setArtists([...artists(), artist]);
		}

		function removeArtist(artist: Artist) {
			setArtists([...artists().filter((a) => a.uuid !== artist.uuid)]);
		}

		const coverPreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return f;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			let updated: Parameters<typeof Music.fromRawObject>[0] | null = null;
			const notifyUpdate = () => {
				if (updated) setNewMusic?.(Music.fromRawObject(updated, music.provider));
			};
			const failEdit = (message: string, status?: number) => {
				if (status === 413) summonErrorToast(() => "File to large");
				else if (status === 415) summonErrorToast(() => "File not supported");
				else summonErrorToast(() => message);
				notifyUpdate();
			};

			try {
				const curTitle = title();
				const curAlbum = album();
				const curPublishedDate = publishedDate();
				const updateRes = await settleResponse(musicUpdateMutation.mutateAsync({ params: { uuid: music.uuid },
					body: {
						name: music.name === curTitle ? undefined : curTitle,
						artistUuids: artists().map((artist) => artist.uuid),
						albumUuid: curAlbum ? (curAlbum.uuid === music.album?.uuid ? undefined : curAlbum.uuid) : music.hasAlbum() ? null : undefined,
						publishedAt: curPublishedDate === music.publishedAt ? undefined : curPublishedDate,
					} }), providerContract.music.update);
				if (updateRes.status !== 200) {
					failEdit("An error occured during the edit of the music", updateRes.status);
					return;
				}
				updated = updateRes.body;

				const curCover = cover();
				if (curCover === null) {
					const removeCoverRes = await settleResponse(
						musicRemoveCoverMutation.mutateAsync({ params: { uuid: music.uuid } }),
						providerContract.music.removeCover,
					);
					if (removeCoverRes.status !== 204) {
						failEdit("An error occured during remove of the cover", removeCoverRes.status);
						return;
					}
					updated.hasCover = false;
				} else if (curCover !== undefined) {
					const uploadCoverRes = await settleResponse(musicUploadCoverMutation.mutateAsync({
						params: { uuid: music.uuid },
						body: { file: curCover },
						onUploadProgress: setCoverProgress,
					}), providerContract.music.uploadCover);
					if (uploadCoverRes.status !== 204) {
						failEdit("An error occured during upload of the cover", uploadCoverRes.status);
						return;
					}
					updated.hasCover = true;
				}
				notifyUpdate();
				props.close();
			} catch (e) {
				console.error(e);
				failEdit("An error occured during the edit of the music");
			}
		};

		const isPending = () => musicUpdateMutation.isPending || musicUploadCoverMutation.isPending || musicRemoveCoverMutation.isPending;

		return <Form class="edit-music-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Edit music</h2>
			<div class="edit-music-info">
				<div class="edit-music-cover-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<Show when={coverPreviewUrl() !== undefined} fallback={<MusicCover music={music} onClick={() => fileInputRef.click()}/>}>
						<img src={coverPreviewUrl() ?? DEFAULT_COVER} onClick={() => fileInputRef.click()} />
					</Show>
					<Show when={(() => { const curCover = cover(); return curCover ?? (curCover === undefined && music.hasCover); })()} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(null)} class="remove-cover-button"><X/></Button>
					</Show>
					<Show when={cover() !== undefined} >
						<Button icon size="sm" variant="ghost" type="button" onClick={() => setCover(undefined)} ><Undo2/></Button>
					</Show>
				</div>
				<div class="edit-music-details">
					<TextInput placeholder="Name" class="edit-music-music-title" onChange={(a) => setTitle(a.currentTarget.value)} value={title()} />
					<TextInput type="date" size="sm" onInput={(e) => setPublishedDate(e.currentTarget.value ? new Date(e.currentTarget.value) : null)}/>
					<Show when={album()} keyed fallback={<div class="edit-music-album no-album"><SelectAlbumMenu provider={music.provider} setAlbum={setAlbum}/></div>}>
						{(album) => <div class="edit-music-album has-album">
							<div class="infos">
								<AlbumCover album={album}/>
								<div class="title">{album.name}</div>
							</div>
							<div class="actions">
								<Button type="button" icon variant="danger" onClick={() => setAlbum(null)}><X size={18}/></Button>
							</div>
						</div>}
					</Show>
				</div>
			</div>
			<div class="edit-music-music-artists" >
				<div class="artist">
					<SelectArtistMenu exclude={artists()} provider={music.provider} addArtist={addArtist}/>
				</div>
				<div class="music-artists-scrollable">
					<For each={artists()} >
						{(artist) => <div class="artist">
							<ArtistAvatar artist={artist}/>
							<span>{artist.name}</span>
							<Button type="button" icon variant="danger" onClick={() => removeArtist(artist)}><X size={18}/></Button>
						</div>}
					</For>
				</div>
			</div>
			<Show when={musicUploadCoverMutation.isPending}>
				<UploadProgress label="Cover upload" value={coverProgress()}/>
			</Show>
			<div class="edit-music-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button disabled={isPending()} type="submit">Edit</Button>
			</div>
		</Form>;
	});
}
