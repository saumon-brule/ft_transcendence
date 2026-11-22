import { Provider, providerContract } from "@flex/shared";
import { type ClientInferResponseBody } from "@ts-rest/core";
import { getProviderClient } from "../providerClients";
import { queryClient } from "../queryClient";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/feedback/Toaster";
import { t } from "~/i18n/context";

type InfiniteList<T> = { pages: T[]; pageParams: unknown[] };
type MusicsList = InfiniteList<ClientInferResponseBody<typeof providerContract.music.list, 200>>;
type AlbumsList = InfiniteList<ClientInferResponseBody<typeof providerContract.album.list, 200>>;
type ArtistsList = InfiniteList<ClientInferResponseBody<typeof providerContract.artist.list, 200>>;

export const invalidateProviderCatalog = (providerData: Provider) => {
	const { keys } = getProviderClient(providerData.address, providerData.uuid);

	for (const key of [keys.info.all(), keys.music.list(), keys.music.get(), keys.album.list(), keys.album.get(), keys.artist.list(), keys.artist.get()]) {
		void queryClient.invalidateQueries({ queryKey: key });
	}
};

export const providerRemoveMusic = async (providerData: Provider, uuid: string) => {
	const providerClient = getProviderClient(providerData.address, providerData.uuid);

	const res = await providerClient.client.music.remove.mutation({ params: { uuid } });
	if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status === 404) {
		summonErrorToast(t("toasts.catalog.musicNotFound"));
	} else if (res.status !== 204) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueriesData<MusicsList>({ queryKey: providerClient.keys.music.list() }, (old) => old && {
			...old,
			pages: old.pages.map((page) => {
				const musics = page.musics.filter((m) => m.uuid !== uuid);
				return { ...page, musics, total: page.total - (page.musics.length - musics.length) };
			}),
		});
		summonSuccessToast(t("toasts.catalog.musicDeleted"));
		return true;
	}
	return false;
};

export const providerRemoveAlbum = async (providerData: Provider, uuid: string) => {
	const providerClient = getProviderClient(providerData.address, providerData.uuid);

	const res = await providerClient.client.album.remove.mutation({ params: { uuid } });
	if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status === 404) {
		summonErrorToast(t("toasts.catalog.albumNotFound"));
	} else if (res.status !== 204) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueriesData<AlbumsList>({ queryKey: providerClient.keys.album.list() }, (old) => old && {
			...old,
			pages: old.pages.map((page) => {
				const albums = page.albums.filter((a) => a.uuid !== uuid);
				return { ...page, albums, total: page.total - (page.albums.length - albums.length) };
			}),
		});
		summonSuccessToast(t("toasts.catalog.albumDeleted"));
		return true;
	}
	return false;
};

export const providerRemoveArtist = async (providerData: Provider, uuid: string) => {
	const providerClient = getProviderClient(providerData.address, providerData.uuid);

	const res = await providerClient.client.artist.remove.mutation({ params: { uuid } });
	if (res.status === 403) {
		summonErrorToast(t("errors.noPermission"));
	} else if (res.status === 404) {
		summonErrorToast(t("toasts.catalog.artistNotFound"));
	} else if (res.status !== 204) {
		summonErrorToast(t("errors.generic"));
	} else {
		queryClient.setQueriesData<ArtistsList>({ queryKey: providerClient.keys.artist.list() }, (old) => old && {
			...old,
			pages: old.pages.map((page) => {
				const artists = page.artists.filter((a) => a.uuid !== uuid);
				return { ...page, artists, total: page.total - (page.artists.length - artists.length) };
			}),
		});
		summonSuccessToast(t("toasts.catalog.artistDeleted"));
		return true;
	}
	return false;
};
