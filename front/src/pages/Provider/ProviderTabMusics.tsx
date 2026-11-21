import { createMemo, Show } from "solid-js";
import { useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import MusicSection, { type MusicSortField } from "~/components/ui/MusicSection/MusicSection";
import NoResult from "~/components/ui/NoResult/NoResult";
import InfiniteScroll from "~/components/ui/InfiniteScroll";
import { useSortParam } from "~/components/ui/SortBar/useSortParam";
import { MUSIC_SORT_FIELDS, Provider } from "@flex/shared";
import type { SearchSort } from "~/api/queryHooks/providerInfo";

export type ProviderTabMusicProps = {
	providerInfo: Provider;
	search: string;
};

export default function ProviderTabMusics(props: ProviderTabMusicProps) {
	const [sort, setSort] = useSortParam(() => MUSIC_SORT_FIELDS);
	// A provider has no column to sort by its own name
	const changeSort = (next: SearchSort<MusicSortField> | undefined) => setSort(next && next.field !== "provider"
		? { field: next.field, order: next.order }
		: undefined);
	const musicsQuery = useProviderMusicsInfiniteQuery(() => props.providerInfo.uuid, () => props.providerInfo, () => props.search, () => ({}), sort);
	const musics = createMemo(() => musicsQuery.data && {
		musics: musicsQuery.data.pages.flatMap((page) => page.musics),
		total: musicsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={musics()} keyed>{(m) => <>
		<Show when={m.total > 0}>
			<section class="musics">
				{/* <h2>Musics</h2> */}
				<MusicSection musics={m.musics} sort={{ value: sort(), onChange: changeSort }}/>
			</section>
		</Show>
		<InfiniteScroll enabled={musicsQuery.hasNextPage === true && !musicsQuery.isFetching} onLoadMore={() => void musicsQuery.fetchNextPage()} />
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
