import { JSX } from "solid-js";

export type MusicTimerProps = JSX.IntrinsicElements["span"] & {
	/** time in second */
	time: number;
};

export default function MusicTimer(props: MusicTimerProps) {
	return <span {...props}>
		{`${Math.floor(props.time / 60)}`.padStart(2, "0")}:{`${Math.floor(props.time % 60)}`.padStart(2, "0")}
	</span>;
}
