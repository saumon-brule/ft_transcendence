import { createMemo, Show } from "solid-js";
import { useProviderArtistsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import NoResult from "~/components/ui/NoResult/NoResult";
import Button from "~/components/inputs/Button";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";

export default function ProviderTabArtists(props: { providerUrl: string; providerUuid: string; search: string }) {
	const artistsQuery = useProviderArtistsInfiniteQuery(() => props.providerUrl, () => props.providerUuid, () => props.search);
	const artists = createMemo(() => artistsQuery.data && {
		artists: artistsQuery.data.pages.flatMap((page) => page.artists),
		total: artistsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={artists()} keyed>{(m) => <>
		<Show when={m.total > 0}>
			<section class="artists">
				{/* <h2>Artists</h2> */}
				<ArtistSection artist={m}/>
			</section>
		</Show>
		<Show when={artistsQuery.hasNextPage}>
			<Button onClick={() => void artistsQuery.fetchNextPage()} disabled={artistsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
