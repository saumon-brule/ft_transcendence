import "./UploadProgress.scss";

type UploadProgressProps = {
	label: string;
	value: number;
};

export default function UploadProgress(props: UploadProgressProps) {
	return <div class="upload-progress">
		<h3>{props.label}</h3>
		<div class="progress-bar"><div class="progress" style={{ width: `${props.value * 100}%` }}/></div>
	</div>;
}
