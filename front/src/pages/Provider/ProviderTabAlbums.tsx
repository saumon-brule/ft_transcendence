import { createMemo, Show } from "solid-js";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import NoResult from "~/components/ui/NoResult/NoResult";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";
import InfiniteScroll from "~/components/ui/InfiniteScroll";
import SortBar from "~/components/ui/SortBar";
import { useSortParam } from "~/components/ui/SortBar/useSortParam";
import { ALBUM_SORT_FIELDS, Provider } from "@flex/shared";

export default function ProviderTabAlbums(props: { providerInfo: Provider; search: string }) {
	const [sort, setSort] = useSortParam(() => ALBUM_SORT_FIELDS);
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => props.providerInfo.address, () => props.providerInfo.uuid, () => props.search, () => ({}), sort);
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
