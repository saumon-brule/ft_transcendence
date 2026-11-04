import { Show } from "solid-js";
import "./NoResult.scss";

export default function NoResult(props: { show: boolean }) {
	return <Show when={props.show} keyed>
		<div class="no-results">
			<span class="no-results-text">No results found</span>
			<div class="af-sad" aria-hidden="true">
				( <span class="af-sad__eye">.<span class="af-sad__tear">'</span></span>_.)
			</div>
		</div>
	</Show>;
}
