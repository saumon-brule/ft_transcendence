import { createMemo, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageArtists.scss";
import { useProviderArtistsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Artist } from "~/class/Artist";
import { ArtistAvatar } from "~/components/ui/ArtistCard";
import { Pencil, Trash } from "lucide-solid";

export function ManageArtists(props: { search: string }) {
	const provider = useProvider();
	const artistsQuery = useProviderArtistsInfiniteQuery(() => provider, () => props.search);
	const artists = createMemo(() => {
		if (artistsQuery.data) return artistsQuery.data.pages.flatMap((page) => page.artists);
		return [];
	});

	return <div id="manage-artists-tab" class="tab-container">
		<Show when={artists().length} keyed fallback={<div>No artists</div>}><section>
			<div class="artists-list">
				<For each={artists()}>{(artist) => <ProviderAristCard artist={artist}/>}</For>
			</div>
		</section></Show>
		<Show when={artistsQuery.hasNextPage}>
			<Button onClick={() => void artistsQuery.fetchNextPage()} disabled={artistsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
	</div>;
}

function ProviderAristCard(props: { artist: Artist }) {

	return <div class="provider-edit-artist-card">
		<div class="infos">
			<ArtistAvatar artist={props.artist}/>
			<div class="name">{props.artist.name}</div>
		</div>
		<div class="actions">
			<Button icon variant="ghost" onClick={() => {}}><Pencil size={18}/></Button>
			<Button icon variant="danger" onClick={() => {}}><Trash size={18}/></Button>
		</div>
	</div>;
}
