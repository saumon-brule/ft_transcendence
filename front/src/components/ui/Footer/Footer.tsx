import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";
import SecondaryControl from "./SecondaryControl";
import { createSignal } from "solid-js";
import Queue from "./Queue";

import "./Footer.scss";

export default function Footer() {
	const [showQueue, setShowQueue] = createSignal(false);

	return <footer id="app-footer">
		<Queue show={showQueue} setShow={setShowQueue}/>
		<div class="footer">
			<CurrentTrack/>
			<Controller/>
			<SecondaryControl setShowQueue={setShowQueue} />
		</div >
	</footer>;
}
