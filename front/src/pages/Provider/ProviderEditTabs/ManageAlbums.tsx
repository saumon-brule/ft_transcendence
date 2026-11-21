import { createMemo, createSignal, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageAlbums.scss";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Album } from "~/class/Album";
import { AlbumCover } from "~/components/ui/AlbumCard";
import { Pencil, Trash } from "lucide-solid";
import { providerRemoveAlbum } from "~/api/queryHooks/providerManageCatalog";
import { summonEditAlbumPopUp } from "../popUps/summonEditAlbumPopUp";

export function ManageAlbums(props: { search: string }) {
	const provider = useProvider();
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => provider, () => props.search);
	const albums = createMemo(() => {
		if (albumsQuery.data) return albumsQuery.data.pages.flatMap((page) => page.albums);
		return [];
	});

	return <div id="manage-albums-tab" class="tab-container">
		<Show when={albums().length} keyed fallback={<div>No albums</div>}><section>
			<div class="albums-list">
				<For each={albums()}>{(album) => <ProviderAlbumCard album={album}/>}</For>
			</div>
		</section></Show>
		<Show when={albumsQuery.hasNextPage}>
			<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
	</div>;
}

function ProviderAlbumCard(props: { album: Album }) {
	const provider = useProvider();
	const [deleting, setDeleting] = createSignal(false);

	async function remove() {
		setDeleting(true);
		await providerRemoveAlbum(provider, props.album.uuid);
		setDeleting(false);
	}

	return <div class="provider-edit-album-card">
		<div class="infos">
			<AlbumCover album={props.album}/>
			<div class="name">{props.album.name}</div>
		</div>
		<div class="actions">
			<Button icon variant="ghost" onClick={() => summonEditAlbumPopUp(props.album)}><Pencil size={18}/></Button>
			<Button icon variant="danger" disabled={deleting()} onClick={() => void remove()}><Trash size={18}/></Button>
		</div>
	</div>;
}
