import { createMemo, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageMusics.scss";
import { Provider } from "@flex/shared";
import { useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Music } from "~/class/Music";
import MusicCover from "~/components/ui/MusicCover";

export function ManageMusics(props: { search: string }) {
	const provider = useProvider();
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => props.search);
	const musics = createMemo(() => {
		if (musicsQuery.data) return musicsQuery.data.pages.flatMap((page) => page.musics);
		return [];
	});

	return <div id="manage-musics-tab" class="tab-container">
		<Show when={musics().length} keyed fallback={<div>No musics</div>}><section>
			<div class="musics-list">
				<For each={musics()}>{(music) => <ProviderAristCard music={music} provider={provider}/>}</For>
			</div>
		</section></Show>
		<Show when={musicsQuery.hasNextPage}>
			<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">See more</Button>
		</Show>
	</div>;
}

function ProviderAristCard(props: { music: Music; provider: Provider }) {

	return <div class="provider-edit-music-card">
		<div class="infos">
			<MusicCover music={props.music}/>
			<div class="name">{props.music.name}</div>
		</div>
		<div class="actions">
			<Button onClick={() => {}}>Edit</Button>
			<Button variant="danger" onClick={() => {}}>Delete</Button>
		</div>
	</div>;
}
