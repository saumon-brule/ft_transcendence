import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { IPicture, parseBlob, selectCover } from "music-metadata";
import { DEFAULT_ARTIST, DEFAULT_COVER } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { ArtistItemDto, Provider, providerContract } from "@flex/shared";
import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/feedback/UploadProgress";
import { Pause, Play, Plus, X } from "lucide-solid";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/cards/ArtistCard";
import { Album } from "~/class/Album";
import "./AddMusicPopUp.scss";
import { SelectAlbumMenu } from "./SelectAlbumMenu";
import { SelectArtistMenu } from "./SelectArtistMenu";
import { AlbumCover } from "~/components/ui/cards/AlbumCard";
import { Music } from "~/class/Music";
import { summonAddArtistPopUp } from "./summonAddArtistPopUp";
import { getProgressionPourcent } from "~/components/layout/Footer/Controller";
import { MusicTimer } from "~/components/common/MusicTimer/MusicTimer";
import { t } from "~/i18n/context";
import { devWarn } from "~/utils/devLog";

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
			result.found.push(Artist.fromRawObject(rawArtist, provider));
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
	if (rawAlbum) return Album.fromRawObject(rawAlbum, provider);
	else return null;
}

export async function summonUploadMusicPopUp(musicFile: File, provider: Provider, onNewMusic?: (newMusic: Music) => void) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	const metadata = await parseBlob(musicFile, { duration: true });

	const { title: fileTitle, artist, artists, album } = metadata.common;
	const { duration } = metadata.format;

	if (!duration) {
		summonErrorToast(() => t("pages.provider.popUps.unreadableFile"));
		return null;
	}

	const artistList = artists?.length ? artists : artist ? [artist] : [];
	const [foundArtists, foundAlbum] = await Promise.all([
		searchRelatedArtists(artistList, provider).catch((e) => {
			devWarn(e);
			return { found: [], rest: artistList };
		}),
		searchRelatedAlbum(album, provider).catch((e) => {
			devWarn(e);
			return null;
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
		const [notFoundArtists, setNotFoundArtists] = createSignal([...foundArtists.rest]);
		const [album, setAlbum] = createSignal(foundAlbum);

		const musicCreateMutation = providerClient.client.music.create.createMutation();
		const musicUploadAudioMutation = providerClient.client.music.uploadAudio.createMutation();
		const musicUploadCoverMutation = providerClient.client.music.uploadCover.createMutation();
		const musicRemoveMutation = providerClient.client.music.remove.createMutation();

		const [audioProgress, setAudioProgress] = createSignal(0);
		const [coverProgress, setCoverProgress] = createSignal(0);

		function addArtistFromRest(artist: Artist) {
			setArtists((prev) => [...prev, artist]);
			setNotFoundArtists((prev) => prev.filter((a) => a !== artist.name));
		}

		function addArtist(artist: Artist) {
			setArtists([...artists(), artist]);
		}

		function removeArtist(artist: Artist) {
			setArtists([...artists().filter((a) => a.uuid !== artist.uuid)]);
		}

		const coverPpreviewUrl = createMemo(() => {
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
				else summonErrorToast(() => t("pages.provider.popUps.music.createError"));
				if (createdUuid) void musicRemoveMutation.mutate({ params: { uuid: createdUuid } });
			};

			try {
				const createRes = await settleResponse(musicCreateMutation.mutateAsync({ body: {
					name: title(),
					artistUuids: artists().map((artist) => artist.uuid),
					duration: Math.floor(duration),
					publishedAt: publishedDate(),
				} }), providerContract.music.create);
				if (createRes.status !== 201) {
					failCreation(createRes.status);
					return;
				}

				const newMusic = createRes.body;
				const uuid = newMusic.uuid;
				createdUuid = uuid;

				const uploadAudioRes = await settleResponse(musicUploadAudioMutation.mutateAsync({
					params: { uuid },
					body: { file: musicFile },
					onUploadProgress: setAudioProgress,
				}), providerContract.music.uploadAudio);
				if (uploadAudioRes.status !== 204) {
					failCreation(uploadAudioRes.status);
					return;
				}

				const curCover = cover();
				if (curCover) {
					const uploadCoverRes = await settleResponse(musicUploadCoverMutation.mutateAsync({
						params: { uuid },
						body: { file: curCover },
						onUploadProgress: setCoverProgress,
					}), providerContract.music.uploadCover);
					if (uploadCoverRes.status !== 204) {
						failCreation(uploadCoverRes.status);
						return;
					}
					newMusic.hasCover = true;
				}
				onNewMusic?.(Music.fromRawObject(newMusic, provider));
				props.close();
			} catch (e) {
				devWarn(e);
				failCreation();
			}
		};

		const isPending = () => musicCreateMutation.isPending || musicUploadAudioMutation.isPending || musicUploadCoverMutation.isPending || musicRemoveMutation.isPending;

		const audioUrl = URL.createObjectURL(musicFile);
		const audio = new Audio(audioUrl);

		const [playing, setPlaying] = createSignal(false);
		const [progression, setProgression] = createSignal(0);
		const [mouseMoveProgression, setMouseMoveProgression] = createSignal<number | null>(null);

		audio.addEventListener("timeupdate", () => setProgression(audio.currentTime));
		audio.addEventListener("play", () => setPlaying(true));
		audio.addEventListener("pause", () => setPlaying(false));
		audio.addEventListener("ended", () => {
			setPlaying(false);
			setProgression(0);
		});

		const displayedProgression = () => (
			mouseMoveProgression() ?? (progression() / duration)
		);
		const displayedProgressionTime = () => {
			const p = mouseMoveProgression();
			return p !== null ? p * duration : progression();
		};

		let progressBarRef!: HTMLDivElement;
		let wasPlaying = false;

		function handleMouseMove(e: MouseEvent) {
			e.preventDefault();
			setMouseMoveProgression(getProgressionPourcent(progressBarRef, e.clientX));
		}

		function handleMouseUp(e: MouseEvent) {
			e.preventDefault();
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			const p = mouseMoveProgression();
			if (p !== null && duration) {
				audio.currentTime = p * duration;
				setProgression(audio.currentTime);
				setMouseMoveProgression(null);
			}
			if (wasPlaying) void audio.play();
			wasPlaying = false;
		}

		function handleMouseDown(e: MouseEvent) {
			e.preventDefault();
			wasPlaying = !audio.paused;
			audio.pause();
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			setMouseMoveProgression(getProgressionPourcent(progressBarRef, e.clientX));
		}

		onCleanup(() => {
			audio.pause();
			audio.src = "";
			URL.revokeObjectURL(audioUrl);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		});

		return <Form class="upload-music-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >{t("pages.provider.popUps.music.addTitle")}</h2>
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
					<TextInput placeholder={t("pages.provider.popUps.namePlaceholder")} class="upload-music-music-title" onChange={(a) => setTitle(a.currentTarget.value)} value={title()} />
					<TextInput type="date" size="sm" onInput={(e) => setPublishedDate(e.currentTarget.value ? new Date(e.currentTarget.value) : null)}/>
					<Show when={album()} keyed fallback={<div class="upload-music-album no-album"><SelectAlbumMenu provider={provider} setAlbum={setAlbum}/></div>}>
						{(album) => <div class="upload-music-album has-album">
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
			<div class="upload-music-preview" style={{ "--progression-bar": `${displayedProgression()}` }}>
				<Button type="button" icon size="sm" onClick={() => (playing() ? audio.pause() : void audio.play())}>
					{playing() ? <Pause/> : <Play/>}
				</Button>
				<div class="progression-bar" ref={progressBarRef} onMouseDown={handleMouseDown}>
					<div/><button type="button"><span/></button>
				</div>
				<MusicTimer class="time" time={displayedProgressionTime()} />
			</div>
			<div class="upload-music-music-artists" >
				<div class="artist">
					<SelectArtistMenu exclude={artists()} provider={provider} addArtist={addArtist}/>
				</div>
				<div class="music-artists-scrollable">
					<For each={artists()} >
						{(artist) => <div class="artist">
							<ArtistAvatar artist={artist}/>
							<span>{artist.name}</span>
							<Button type="button" icon variant="danger" onClick={() => removeArtist(artist)}><X size={18}/></Button>
						</div>}
					</For>
					<For each={notFoundArtists()}>
						{(artistName) => <div class="artist">
							<img src={DEFAULT_ARTIST} alt={t("common.artistPicture")}/>
							<span>{artistName}</span>
							<Button type="button" icon onClick={() => summonAddArtistPopUp(provider, artistName, addArtistFromRest)}><Plus size={18}/></Button>
						</div>}
					</For>
				</div>
			</div>
			<Show when={musicUploadAudioMutation.isPending}>
				<UploadProgress label={t("pages.provider.popUps.audioUpload")} value={audioProgress()}/>
			</Show>
			<Show when={musicUploadCoverMutation.isPending}>
				<UploadProgress label={t("pages.provider.popUps.coverUpload")} value={coverProgress()}/>
			</Show>
			<div class="upload-music-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>{t("common.cancel")}</Button>
				<Button disabled={isPending()} type="submit">{t("pages.provider.popUps.upload")}</Button>
			</div>
		</Form>;
	});
}
