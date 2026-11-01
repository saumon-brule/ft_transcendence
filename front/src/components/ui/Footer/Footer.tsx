import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";
import SecondaryControl from "./SecondaryControl";

import "./Footer.scss";

export default function Footer() {
	return <footer id="app-footer">
		<CurrentTrack/>
		<Controller/>
		<SecondaryControl/>
	</footer>;
}
