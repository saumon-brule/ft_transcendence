import { RouteSectionProps } from "@solidjs/router";
import Sidebar from "~/components/layout/Sidebar";

import "./SidebarRoute.scss";

export default function SidebarRoute(props: RouteSectionProps) {
	return <div id="app-body">
		<Sidebar/>
		{props.children}
	</div>;
}
