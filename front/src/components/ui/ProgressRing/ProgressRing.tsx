import "./ProgressRing.scss";

type ProgressRingProps = {
	value: number;
	class?: string;
};

export default function ProgressRing(props: ProgressRingProps) {
	return <div class={`progress-ring ${props.class ?? ""}`}>
		<div class="ring" style={{ "--progress": `${props.value * 100}` }}/>
	</div>;
}
