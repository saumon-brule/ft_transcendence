import { For, Match, Show, Switch } from "solid-js";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";
import { Music } from "~/class/Music";
import "./MusicSection.scss";
import { A } from "@solidjs/router";
import Button from "~/components/inputs/Button";
import MusicCover from "../MusicCover";
import ArtistsLinks from "../ArtistLinks";
import { formatTimer } from "~/components/common/MusicTimer/MusicTimer";
import { Provider } from "@flex/shared";
import { MusicGroup } from "~/store/trackManager.store";
import UnavailableMusicRow, { type PlaylistContext } from "./UnavailableTrackRow";
import { MusicActionMenu } from "./MusicActionMenu";
import { ArrowDown, ArrowUp } from "lucide-solid";
import type { SearchSort } from "~/api/queryHooks/providerInfo";
import { nextSort } from "~/components/ui/SortBar/useSortParam";


export type MusicSectionColumn = "actions" | "artists" | "album" | "published" | "duration";

export type MusicSortField = "name" | "artist" | "album" | "provider" | "published" | "duration";

/** When given, the headers of the sortable columns become buttons that cycle through ascending, descending and the default order. */
export type MusicSectionSort = {
	value: SearchSort<MusicSortField> | undefined;
	onChange: (sort: SearchSort<MusicSortField> | undefined) => void;
};

function isGroupMusicSection(props: MusicSectionProps | GroupMusicSectionProps): props is GroupMusicSectionProps {
	return "musicGroup" in props;
}

export type MusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	playlist?: PlaylistContext;
	sort?: MusicSectionSort;
	musics: Array<Music>;
};

export type GroupMusicSectionProps = {
	hiddenColumns?: MusicSectionColumn[];
	providers?: Provider[];
	showCurrent?: boolean;
	playlist?: PlaylistContext;
	sort?: MusicSectionSort;
	musicGroup: MusicGroup;
};

export default function MusicSection(props: MusicSectionProps | GroupMusicSectionProps) {
	const audioManager = useAudioManagerContext();
	const shown = (column: MusicSectionColumn) => !props.hiddenColumns?.includes(column);

	function toDate(value: Date | string): Date {
		return value instanceof Date ? value : new Date(value);
	}

	function handleMusicClick(index: number) {
		if (isGroupMusicSection(props)) {
			audioManager.setMusicGroup(props.musicGroup);
			audioManager.position = index;
		} else {
			audioManager.setCurrentMusic(props.musics[index]);
		}
		audioManager.play();
	}

	const columnCount = () => 1
		+ (shown("actions") ? 1 : 0)
		+ (shown("artists") ? 1 : 0)
		+ (shown("album") ? 1 : 0)
		+ (props.providers?.length ? 1 : 0)
		+ (shown("published") ? 1 : 0)
		+ (shown("duration") ? 1 : 0);


	const ariaSort = (field: MusicSortField) => props.sort?.value?.field === field
		? props.sort.value.order === "asc"
			? "ascending"
			: "descending"
		: undefined;

	function SortHeader(headerProps: { field: MusicSortField; children: string }) {
		return <Show when={props.sort} fallback={headerProps.children}>
			{(sort) => <Button type="button" variant="text" class="sort-header" classList={{ active: sort().value?.field === headerProps.field }} onClick={() => sort().onChange(nextSort(sort().value, headerProps.field))}>
				{headerProps.children}
				<span class="sort-arrow" aria-hidden="true">
					<Show when={sort().value?.field === headerProps.field}>
						{sort().value?.order === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
					</Show>
				</span>
			</Button>}
		</Show>;
	}

	const musicList = () => isGroupMusicSection(props) ? props.musicGroup.musics : props.musics;

	return <div class="music-section">
		<table class="data">
			<thead>
				<tr>
					<th class="col-title" scope="col" aria-sort={ariaSort("name")}><SortHeader field="name">Title</SortHeader></th>
					<Show when={shown("actions")}><th class="col-actions" scope="col" /></Show>
					<Show when={shown("artists")}><th class="col-artists" scope="col" aria-sort={ariaSort("artist")}><SortHeader field="artist">Artists</SortHeader></th></Show>
					<Show when={shown("album")}><th class="col-album" scope="col" aria-sort={ariaSort("album")}><SortHeader field="album">Album</SortHeader></th></Show>
					<Show when={props.providers?.length}><th class="col-provider" scope="col" aria-sort={ariaSort("provider")}><SortHeader field="provider">Provider</SortHeader></th></Show>
					<Show when={shown("published")}><th class="col-published" scope="col" aria-sort={ariaSort("published")}><SortHeader field="published">Published</SortHeader></th></Show>
					<Show when={shown("duration")}><th class="col-duration" scope="col" aria-sort={ariaSort("duration")}><SortHeader field="duration">Duration</SortHeader></th></Show>
				</tr>
			</thead>
			<tbody>
				<For each={musicList()}>
					{(music, i) => <Switch>
						<Match when={music.isUnavailable() && music} keyed>
							{(unavailableMusic) => <UnavailableMusicRow music={unavailableMusic} columns={columnCount()} playlist={props.playlist} />}
						</Match>
						<Match when={!music.isUnavailable() && music}>
							<tr>
								<td class="col-title">
									<div class="music-title" onClick={() => handleMusicClick(i())}>
										<MusicCover music={music} />
										<div class="music-title-text">
											<Button variant="text">{music.name}</Button>
											<Show when={shown("artists")}>
												<span class="music-title-artists">
													<ArtistsLinks artists={music.artists} providerUUID={music.provider.uuid} />
												</span>
											</Show>
										</div>
									</div>
								</td>
								<Show when={shown("actions")}>
									<td class="col-actions">
										<MusicActionMenu music={music} playlist={props.playlist} />
									</td>
								</Show>
								<Show when={shown("artists")}><td class="col-artists"><ArtistsLinks artists={music.artists} providerUUID={music.provider.uuid} /></td></Show>
								<Show when={shown("album")}><td class="col-album">{music.hasAlbum() ? <A href={music.albumRoute()} class="white-variant">{music.album.name}</A> : "-"}</td></Show>
								<Show when={props.providers?.length}><td class="col-provider"><A href={`/provider/${music.provider.uuid}`}>{props.providers?.find((provider) => provider.uuid === music.provider.uuid)?.name}</A></td></Show>
								<Show when={shown("published")}><td class="col-published">{music.publishedAt ? toDate(music.publishedAt).toLocaleDateString() : "-"}</td></Show>
								<Show when={shown("duration")}><td class="col-duration">{formatTimer(music.duration)}</td></Show>
							</tr>
						</Match>
					</Switch>}
				</For>
			</tbody>
		</table>
	</div>;
}
