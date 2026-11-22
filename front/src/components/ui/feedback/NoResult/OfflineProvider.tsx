import { Show } from "solid-js";
import "./NoResult.scss";
import { useTranslation } from "~/i18n/context";
import { useNavigate } from "@solidjs/router";
import Button from "~/components/inputs/Button";

export default function NoResult(props: { show: boolean }) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const goBack = () => {
		if (window.history.length > 1) navigate(-1);
		else navigate("/home");
	};

	return <Show when={props.show} keyed>
		<div class="no-results">
			<span class="no-results-text">{t("components.noResult.offlineProvider")}</span>
			<span class="no-results-subtext"><Button onClick={goBack}>{t("common.back")}</Button></span>
			<div class="af-sad" aria-hidden="true">
				( <span class="af-sad__eye">.<span class="af-sad__tear">'</span></span>_.)
			</div>
		</div>
	</Show>;
}
