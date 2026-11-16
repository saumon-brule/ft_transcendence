import Controller from "./Controller";
import CurrentTrack from "./CurrentTrack";
import SecondaryControl from "./SecondaryControl";
import { createEffect, createSignal, on, Show } from "solid-js";
import Queue from "./Queue";
import "./Footer.scss";
import Button from "~/components/inputs/Button/Button";
import { ChevronDown } from "lucide-solid";
import FloatingFooter from "./FloatingFooter";
import { useAudioManagerContext } from "~/components/context/AudioManagerContext";

export default function Footer() {
	const audioManager = useAudioManagerContext();
	const [showQueue, setShowQueue] = createSignal(false);
	const [showFooter, setShowFooter] = createSignal(false);
	const hasSomethingToPlay = () => !!(audioManager.currentMusic || audioManager.musicGroup || audioManager.queue.length);

	createEffect(on(hasSomethingToPlay, (visible) => {
		if (!visible) {
			setShowQueue(false);
			setShowFooter(false);
		}
	}, { defer: true }));

	return <Show when={hasSomethingToPlay()}><footer id="app-footer" classList={{ "hide": !showFooter() }}>
		<Button class="close-footer" icon onClick={() => setShowFooter(false)}><ChevronDown/></Button>
		<Queue show={showQueue} setShow={setShowQueue}/>
		<div class="footer">
			<CurrentTrack/>
			<Controller/>
			<SecondaryControl setShowQueue={setShowQueue} />
		</div >
	</footer>
	<FloatingFooter hidden={showFooter()} onOpen={() => setShowFooter(true)} />
	</Show>;
}
