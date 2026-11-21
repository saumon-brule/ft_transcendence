import { createMemo, Show } from "solid-js";
import { useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import MusicSection from "~/components/ui/MusicSection/MusicSection";
import NoResult from "~/components/ui/NoResult/NoResult";
import Button from "~/components/inputs/Button";
import { useProvider } from "~/components/guards/ProviderInfoGuard";

export type ProviderTabMusicProps = {
	search: string;
};

export default function ProviderTabMusics(props: ProviderTabMusicProps) {
	const provider = useProvider();
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => props.search);
	const musics = createMemo(() => musicsQuery.data && {
		musics: musicsQuery.data.pages.flatMap((page) => page.musics),
		total: musicsQuery.data.pages[0]?.total ?? 0,
	});

	return <Show when={musics()} keyed>{(m) => <>
		<Show when={m.total > 0}>
			<section class="musics">
				{/* <h2>Musics</h2> */}
				<MusicSection musics={m.musics}/>
			</section>
		</Show>
		<Show when={musicsQuery.hasNextPage}>
			<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
		<NoResult show={m.total === 0} />
	</>}</Show>;
}
