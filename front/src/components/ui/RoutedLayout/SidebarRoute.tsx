import { RouteSectionProps } from "@solidjs/router";
import Sidebar from "../Sidebar";

import "./SidebarRoute.scss";

export default function SidebarRoute(props: RouteSectionProps) {
	return <div id="app-body">
		<Sidebar/>
		<div>{props.children}</div>
	</div>;
}
