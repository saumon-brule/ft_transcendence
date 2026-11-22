import { createMemo, createSignal, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageMusics.scss";
import { useProviderMusicsInfiniteQuery } from "~/api/queryHooks/providerInfo";
import { Music } from "~/class/Music";
import MusicCover from "~/components/ui/elements/MusicCover";
import { Pencil, Trash } from "lucide-solid";
import { providerRemoveMusic } from "~/api/queryHooks/providerManageCatalog";
import { summonEditMusicPopUp } from "../popUps/summonEditMusicPopUp";
import { useTranslation } from "~/i18n/context";

export function ManageMusics(props: { search: string }) {
	const { t } = useTranslation();
	const provider = useProvider();
	const musicsQuery = useProviderMusicsInfiniteQuery(() => provider, () => props.search);
	const musics = createMemo(() => {
		if (musicsQuery.data) return musicsQuery.data.pages.flatMap((page) => page.musics);
		return [];
	});

	return <div id="manage-musics-tab" class="tab-container">
		<Show when={musics().length} keyed fallback={<div>{t("pages.provider.edit.noMusics")}</div>}><section>
			<div class="musics-list">
				<For each={musics()}>{(music) => <ProviderAristCard music={music}/>}</For>
			</div>
		</section></Show>
		<Show when={musicsQuery.hasNextPage}>
			<Button onClick={() => void musicsQuery.fetchNextPage()} disabled={musicsQuery.isFetchingNextPage} variant="text" class="white-variant see-more">{t("pages.search.seeMore")}</Button>
		</Show>
	</div>;
}

function ProviderAristCard(props: { music: Music }) {
	const provider = useProvider();
	const [deleting, setDeleting] = createSignal(false);

	async function remove() {
		setDeleting(true);
		await providerRemoveMusic(provider, props.music.uuid);
		setDeleting(false);
	}

	return <div class="provider-edit-music-card">
		<div class="infos">
			<MusicCover music={props.music}/>
			<div class="subinfo">
				<div class="name">{props.music.name}</div>
				<div class="artists">{props.music.artists.map((a) => a.name).join(", ")}</div>
			</div>
		</div>
		<div class="actions">
			<Button icon variant="ghost" onClick={() => summonEditMusicPopUp(props.music)}><Pencil size={18}/></Button>
			<Button icon variant="danger" disabled={deleting()} onClick={() => void remove()}><Trash size={18}/></Button>
		</div>
	</div>;
}
