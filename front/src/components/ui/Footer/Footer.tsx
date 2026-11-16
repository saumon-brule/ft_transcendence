import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";
import SecondaryControl from "./SecondaryControl";
import { createSignal } from "solid-js";
import Queue from "./Queue";
import "./Footer.scss";
import Button from "~/components/inputs/Button/Button";
import { ChevronDown } from "lucide-solid";
import FloatingFooter from "./FloatingFooter";

export default function Footer() {
	const [showQueue, setShowQueue] = createSignal(false);
	const [showFooter, setShowFooter] = createSignal(false);

	return <><footer id="app-footer" classList={{ "hide": !showFooter() }}>
		<Button class="close-footer" icon onClick={() => setShowFooter(false)}><ChevronDown/></Button>
		<Queue show={showQueue} setShow={setShowQueue}/>
		<div class="footer">
			<CurrentTrack/>
			<Controller/>
			<SecondaryControl setShowQueue={setShowQueue} />
		</div >
	</footer>
	<FloatingFooter hidden={showFooter()} onOpen={() => setShowFooter(true)} />
	</>;
}
