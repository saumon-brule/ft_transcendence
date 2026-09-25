import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";

import "./Footer.scss";

export default function Footer() {
	return <footer id="app-footer">
		<CurrentTrack/>
		<Controller/>
		<div id="dummy-secondary-controls" />
	</footer>;
}
