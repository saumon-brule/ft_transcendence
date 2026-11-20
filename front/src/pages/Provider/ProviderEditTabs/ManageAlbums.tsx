import { createMemo, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageAlbums.scss";
import { Provider } from "@flex/shared";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Album } from "~/class/Album";
import { AlbumCover } from "~/components/ui/AlbumCard";
import { Pencil, Trash } from "lucide-solid";

export function ManageAlbums(props: { search: string }) {
	const provider = useProvider();
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => provider.address, () => provider.uuid, () => props.search);
	const albums = createMemo(() => {
		if (albumsQuery.data) return albumsQuery.data.pages.flatMap((page) => page.albums);
		return [];
	});

	return <div id="manage-albums-tab" class="tab-container">
		<Show when={albums().length} keyed fallback={<div>No albums</div>}><section>
			<div class="albums-list">
				<For each={albums()}>{(album) => <ProviderAristCard album={album} provider={provider}/>}</For>
			</div>
		</section></Show>
		<Show when={albumsQuery.hasNextPage}>
			<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
	</div>;
}

function ProviderAristCard(props: { album: Album; provider: Provider }) {

	return <div class="provider-edit-album-card">
		<div class="infos">
			<AlbumCover album={props.album}/>
			<div class="name">{props.album.name}</div>
		</div>
		<div class="actions">
			<Button icon variant="ghost" onClick={() => {}}><Pencil size={18}/></Button>
			<Button icon variant="danger" onClick={() => {}}><Trash size={18}/></Button>
		</div>
	</div>;
}
