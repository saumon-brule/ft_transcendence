import { Show } from "solid-js";
import "./NoResult.scss";
import { useTranslation } from "~/i18n/context";

export default function NoResult(props: { show: boolean }) {
	const { t } = useTranslation();
	return <Show when={props.show} keyed>
		<div class="no-results">
			<span class="no-results-text">{t("components.noResult.noResults")}</span>
			<div class="af-sad" aria-hidden="true">
				( <span class="af-sad__eye">.<span class="af-sad__tear">'</span></span>_.)
			</div>
		</div>
	</Show>;
}
