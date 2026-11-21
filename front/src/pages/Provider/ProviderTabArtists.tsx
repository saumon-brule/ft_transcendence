import { createMemo, Show } from "solid-js";
import { useProviderArtistsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import NoResult from "~/components/ui/NoResult/NoResult";
import ArtistSection from "~/components/ui/ArtistSection/ArtistSection";
import InfiniteScroll from "~/components/ui/InfiniteScroll";
import SortBar from "~/components/ui/SortBar";
import { useSortParam } from "~/components/ui/SortBar/useSortParam";
import { ARTIST_SORT_FIELDS, Provider } from "@flex/shared";

export default function ProviderTabArtists(props: { providerInfo: Provider; search: string }) {
	const [sort, setSort] = useSortParam(() => ARTIST_SORT_FIELDS);
	const artistsQuery = useProviderArtistsInfiniteQuery(() => props.providerInfo.address, () => props.providerInfo.uuid, () => props.search, sort);
	const artists = createMemo(() => artistsQuery.data && {
		artists: artistsQuery.data.pages.flatMap((page) => page.artists),
		total: artistsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={artists()} keyed>{(m) => <>
		<SortBar fields={ARTIST_SORT_FIELDS} value={sort()} onChange={setSort} />
		<Show when={m.total > 0}>
			<section class="artists">
				{/* <h2>Artists</h2> */}
				<ArtistSection artist={m}/>
			</section>
		</Show>
		<InfiniteScroll enabled={artistsQuery.hasNextPage === true && !artistsQuery.isFetching} onLoadMore={() => void artistsQuery.fetchNextPage()} />
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
