import { createMemo, Show } from "solid-js";
import { useProviderAlbumsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import NoResult from "~/components/ui/NoResult/NoResult";
import Button from "~/components/inputs/Button";
import AlbumSection from "~/components/ui/AlbumSection/AlbumSection";

export default function ProviderTabAlbums(props: { providerUrl: string; providerUuid: string }) {
	const albumsQuery = useProviderAlbumsInfiniteQuery(() => props.providerUrl, () => props.providerUuid);
	const albums = createMemo(() => albumsQuery.data && {
		albums: albumsQuery.data.pages.flatMap((page) => page.albums),
		total: albumsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={albums()} keyed>{(m) => <>
		<Show when={m.total > 0}>
			<section class="albums">
				{/* <h2>Albums</h2> */}
				<AlbumSection album={m}/>
			</section>
		</Show>
		<Show when={albumsQuery.hasNextPage}>
			<Button onClick={() => void albumsQuery.fetchNextPage()} disabled={albumsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
