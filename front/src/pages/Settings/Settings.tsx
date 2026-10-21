
import { RouteSectionProps } from "@solidjs/router";
import "./Settings.scss";


export default function Settings(props: RouteSectionProps) {

	return <div class="page" id="settings">
		{props.children}
	</div>;
}
