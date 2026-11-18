import type { JSX } from "solid-js";

export const DEFAULT_COVER = "/images/default_cover.webp";
export const DEFAULT_ALBUM = "/images/default_album.webp";
export const DEFAULT_ARTIST = "/images/default_artist.webp";

export function imgFallback(fallback: string): JSX.EventHandler<HTMLImageElement, Event> {
	return (e) => {
		const img = e.currentTarget;
		if (img.getAttribute("src") !== fallback) img.src = fallback;
	};
}
