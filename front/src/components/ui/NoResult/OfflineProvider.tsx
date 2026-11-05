import { Show } from "solid-js";
import "./NoResult.scss";
import { A, useNavigate } from "@solidjs/router";
import Button from "~/components/inputs/Button";

export default function NoResult(props: { show: boolean }) {
	const navigate = useNavigate();

	const goBack = () => {
		if (window.history.length > 1)
			navigate(-1);
		else
			navigate("/home");
	};

	return <Show when={props.show} keyed>
		<div class="no-results">
			<span class="no-results-text">This provider is offline</span>
			<span class="no-results-subtext"><Button onClick={goBack}>Back</Button></span>
			<div class="af-sad" aria-hidden="true">
				( <span class="af-sad__eye">.<span class="af-sad__tear">'</span></span>_.)
			</div>
		</div>
	</Show>;
}
