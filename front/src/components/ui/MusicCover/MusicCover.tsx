import { JSX, splitProps } from "solid-js";
import { useMediaToken } from "~/api/providerClients";
import { Music } from "~/class/Music";

import "./MusicCover.scss";

export type MusicCoverProps = JSX.IntrinsicElements["img"] & {
	music: Music;
};

export default function MusicCover(props: MusicCoverProps) {
	const [local, rest] = splitProps(props, ["music", "class"]);

	const mediaToken = useMediaToken(() => local.music.providerUrl, () => local.music.providerUuid);

	const src = () => {
		const token = mediaToken();
		if (token && local.music.hasCover) return local.music.coverUrl(token);
		return "/images/default_cover.png";
	};

	return <img class={`music-cover ${local.class ?? ""}`} src={src()} alt={local.music.name} {...rest} />;
}
