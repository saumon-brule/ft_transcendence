import { Show } from "solid-js";
import "./NoResult.scss";
import { useNavigate } from "@solidjs/router";
import Button from "~/components/inputs/Button";

export default function PageNotFound(props: { show: boolean }) {
	const navigate = useNavigate();

	return <Show when={props.show} keyed>
		<div class="no-results">
			<span class="no-results-text">Page not found</span>
			<span class="no-results-subtext"><Button onClick={() => navigate("/home")}>Home</Button></span>
			<div class="af-sad" aria-hidden="true">
				( <span class="af-sad__eye">.<span class="af-sad__tear">'</span></span>_.)
			</div>
		</div>
	</Show>;
}
