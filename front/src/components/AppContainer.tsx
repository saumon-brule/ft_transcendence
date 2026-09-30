import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "./context/AudioManagerContext";
import Footer from "./ui/Footer/Footer";

export default function AppContainer(props: RouteSectionProps) {

	return <>
		<AudioPlayerProvider>
			<main>
				{props.children}
			</main>
			<Footer/>
		</AudioPlayerProvider>
	</>;
}
