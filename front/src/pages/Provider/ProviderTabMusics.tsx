import { createMemo, Show } from "solid-js";
import { useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import NoResult from "~/components/ui/NoResult/NoResult";
import Button from "~/components/inputs/Button";

export default function ProviderTabMusics(props: { providerUrl: string; providerUuid: string }) {
	const musicsQuery = useProviderMusicsInfiniteQuery(() => props.providerUrl, () => props.providerUuid);
	const musics = createMemo(() => musicsQuery.data && {
		musics: musicsQuery.data.pages.flatMap((page) => page.musics),
		total: musicsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={musics()} keyed>{(m) => <>
		<Show when={m.total > 0}>
			<section class="musics">
				{/* <h2>Musics</h2> */}
				<MusicSection music={m}/>
			</section>
		</Show>
		<Show when={musicsQuery.hasNextPage}>
			<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
