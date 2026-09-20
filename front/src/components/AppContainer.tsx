import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "./context/AudioManagerContext";
import ControllerBar from "./ui/Footer/Controller";

export default function AppContainer(props: RouteSectionProps) {

	return <>
		<AudioPlayerProvider>
			<main>
				{props.children}
			</main>
			<ControllerBar/>
		</AudioPlayerProvider>
	</>;
}
