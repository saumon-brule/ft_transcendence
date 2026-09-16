import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "./context/AudioManagerContext";

export default function AppContainer(props: RouteSectionProps) {

	return <>
		<AudioPlayerProvider>
			{props.children}
		</AudioPlayerProvider>
	</>;
}
