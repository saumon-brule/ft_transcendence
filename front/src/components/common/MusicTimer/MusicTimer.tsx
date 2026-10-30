import { JSX, splitProps } from "solid-js";

export type MusicTimerProps = JSX.IntrinsicElements["span"] & {
	/** time in second */
	time: number;
};

export function formatTimer(duration: number): string {
	const minutes = Math.floor(duration / 60);
	const seconds = Math.floor(duration % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MusicTimer(props: MusicTimerProps) {
	const [local, rest] = splitProps(props, ["time"]);
	return <span {...rest}>
		{formatTimer(local.time)}
	</span>;
}
