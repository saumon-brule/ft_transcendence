import { summonPopUp } from "~/components/ui/Overlay";
import { IPicture, parseBlob, selectCover } from "music-metadata";
import { DEFAULT_COVER } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, JSX, onCleanup, onMount } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient, ProviderClient } from "~/api/providerClients";
import { AlbumDetailedItemDto, Provider } from "@flex/shared";
import "./AddMusicPopUp.scss";
import { Plus } from "lucide-solid";
import { summonErrorToast } from "~/components/ui/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistItemDto } from "node_modules/@flex/shared/dist/contracts/provider/schemas/items.schema";
import ArtistCard from "~/components/ui/ArtistCard";
import { Album } from "~/class/Album";

type FileChangeEventHandler = JSX.EventHandler<HTMLInputElement, Event>;

function pictureToFile(pic: IPicture, baseName = "cover"): File {
	const ext = pic.format.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
	return new File([new Uint8Array(pic.data)], `${baseName}.${ext}`, { type: pic.format });
}

async function searchRelatedArtists(artists: Array<string>, provider: Provider): Promise<{ found: Array<Artist>; rest: Array<string> }> {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	const responses = await Promise.all(artists.map((artist) => providerClient.client.artist.list.query({
		query: { offset: 0, limit: 1, search: artist },
	})));

	const result: { found: Array<Artist>; rest: Array<string> } = { found: [], rest: [] };
	responses.forEach((response, i) => {
		const rawArtist: ArtistItemDto | null = (response.status === 200 && response.body.artists[0]) || null;
		if (rawArtist) {
			result.found.push(Artist.fromRawObject(rawArtist, provider.address, provider.uuid));
		} else {
			result.rest.push(artists[i]);
		}
	});
	return result;
}

async function searchRelatedAlbum(album: string | undefined, provider: Provider): Promise<Album | null> {
	if (!album) return null;
	const providerClient = getProviderClient(provider.address, provider.uuid);
	const response = await providerClient.client.album.list.query({
		query: { offset: 0, limit: 1, search: album },
	});

	const rawAlbum = (response.status === 200 && response.body.albums[0]) || null;
	if (rawAlbum) return Album.fromRawObject(rawAlbum, provider.address, provider.uuid);
	else return null;
}

export async function summonUploadMusicPopUp(musicFile: File, provider: Provider) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	const metadata = await parseBlob(musicFile, { duration: true });

	const { title: fileTitle, artist, artists, album } = metadata.common;
	const { duration } = metadata.format;

	if (!duration) {
		summonErrorToast(() => "Unreadable or unusable file");
		return null;
	}

	const artistList = artists?.length ? artists : artist ? [artist] : [];
	const [foundArtists, foundAlbum] = await Promise.all([
		searchRelatedArtists(artistList, provider).catch((e) => {
			console.error(e);
			return { found: [], rest: artistList };
		}),
		searchRelatedAlbum(album, provider).catch((e) => {
			console.error(e);
			return { found: [], rest: artistList };
		}),
	]);
	const releaseYear = metadata.common.originalyear ?? metadata.common.year;
	const releaseDate = new Date((metadata.common.originaldate ?? metadata.common.date) || `${releaseYear}-01-01`);

	const coverPic = selectCover(metadata.common.picture);
	let fileCover: File | null = null;
	if (coverPic) {
		fileCover = pictureToFile(coverPic);
	}


	return summonPopUp((props) => {
		const [title, setTitle] = createSignal(fileTitle ?? musicFile.name.replace(/\.[^/.]+$/, ""));
		const [publishedDate, setPublishedDate] = createSignal<Date | null>(releaseDate);
		const [cover, setCover] = createSignal(fileCover);
		const [artists, setArtists] = createSignal([...foundArtists.found]);
		const [album, setAlbum] = createSignal(foundAlbum);

		const coverPpreviewUrl = createMemo(() => {
			const f = cover();
			if (!f) return null;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			try {
				const createRes = await providerClient.client.music.create.mutation({
					body: {
						name: title(),
						artistUuids: artists().map((artist) => artist.uuid),
						duration: Math.floor(duration),
						publishedAt: publishedDate(),
					},
				});
				if (createRes.status !== 201) {
					// if (createRes.status === 404) summonErrorToast(() => "Something not found");
					summonErrorToast(() => "An error occured during creation of the music");
					return;
				}
				const uuid = createRes.body.uuid;
				const uploadAudioRes = await providerClient.client.music.uploadAudio.mutation({ params: { uuid }, body: { file: musicFile } });
				if (uploadAudioRes.status !== 204) {
					if (uploadAudioRes.status === 413) summonErrorToast(() => "File to large");
					else if (uploadAudioRes.status === 415) summonErrorToast(() => "File not supported");
					else summonErrorToast(() => "An error occured during creation of the music");
					void providerClient.client.music.remove.mutation({ params: { uuid } });
					return;
				}
				const curCover = cover();
				if (!curCover) return;
				const uploadCoverRes = await providerClient.client.music.uploadCover.mutation({ params: { uuid }, body: { file: curCover } });
				if (uploadCoverRes.status !== 204) {
					if (uploadCoverRes.status === 413) summonErrorToast(() => "File to large");
					else if (uploadCoverRes.status === 415) summonErrorToast(() => "File not supported");
					else summonErrorToast(() => "An error occured during creation of the music");
					void providerClient.client.music.remove.mutation({ params: { uuid } });
					return;
				}
			} catch (e) {
				console.error(e);
				summonErrorToast(() => "An error occured during creation of the music");
				close();
			}
		};

		return <Form class="upload-music-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >Upload new music</h2>
			<div class="upload-music-info">
				<div class="upload-music-cover-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setCover(e.currentTarget.files?.[0] ?? null)}
					/>
					<img src={coverPpreviewUrl() ?? DEFAULT_COVER} onClick={() => fileInputRef.click()}/>
				</div>
				<div class="upload-music-details">
					<TextInput placeholder="Name" class="upload-music-music-title" onChange={(a) => setTitle(a.currentTarget.value)} value={title()} />
					<input type="date" onInput={(e) => setPublishedDate(e.currentTarget.value ? new Date(e.currentTarget.value) : null)}/>
					<div class="upload-music-album">
						<h3>album</h3>
						<div>{album ?? ""}</div>
					</div>
				</div>
			</div>
			<h3>Artists</h3>
			<div class="upload-music-music-artists" >
				<For each={artists()} >
					{(artist) => <div>
						<ArtistCard artist={artist}/>
					</div>}
				</For>
				<For each={foundArtists.rest} >
					{(artistName) => <div>{artistName}</div>}
				</For>
				<div>
					<button type="button"><Plus/>add artist</button>
				</div>
			</div>
			<div class="upload-music-pop-up-controls">
				<Button type="button" variant="ghost" onClick={props.close}>Cancel</Button>
				<Button type="submit">Upload</Button>
			</div>
		</Form>;
	});
}
