import { JSX, splitProps } from "solid-js";

export type MusicTimerProps = JSX.IntrinsicElements["span"] & {
	/** time in second */
	time: number;
};

export default function MusicTimer(props: MusicTimerProps) {
	const [local, rest] = splitProps(props, ["time"]);
	return <span {...rest}>
		{`${Math.floor(local.time / 60)}`.padStart(2, "0")}:{`${Math.floor(local.time % 60)}`.padStart(2, "0")}
	</span>;
}
