import { createMemo, Show } from "solid-js";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import NoResult from "~/components/ui/feedback/NoResult/NoResult";
import AlbumSection from "~/components/ui/sections/AlbumSection/AlbumSection";
import InfiniteScroll from "~/components/ui/navigation/InfiniteScroll";
import SortBar from "~/components/ui/navigation/SortBar";
import { useSortParam } from "~/components/ui/navigation/SortBar/useSortParam";
import { ALBUM_SORT_FIELDS } from "@flex/shared";

export default function ProviderTabAlbums(props: { search: string }) {
	const [sort, setSort] = useSortParam(() => ALBUM_SORT_FIELDS);
	const provider = useProvider();
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => provider, () => props.search, () => ({}), sort);
	const albums = createMemo(() => albumsQuery.data && {
		albums: albumsQuery.data.pages.flatMap((page) => page.albums),
		total: albumsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={albums()} keyed>{(m) => <>
		<SortBar fields={ALBUM_SORT_FIELDS} value={sort()} onChange={setSort} />
		<Show when={m.total > 0}>
			<section class="albums">
				{/* <h2>Albums</h2> */}
				<AlbumSection album={m}/>
			</section>
		</Show>
		<InfiniteScroll enabled={albumsQuery.hasNextPage === true && !albumsQuery.isFetching} onLoadMore={() => void albumsQuery.fetchNextPage()} />
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
