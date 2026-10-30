import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";
import VolumeControl from "./VolumeControl";

import "./Footer.scss";

export default function Footer() {
	return <footer id="app-footer">
		<CurrentTrack/>
		<Controller/>
		<VolumeControl/>
	</footer>;
}
