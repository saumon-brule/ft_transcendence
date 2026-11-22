import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "~/components/context/AudioManagerContext";
import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import "./AppContainer.scss";

export default function AppContainer(props: RouteSectionProps) {

	return <div id="app-container">
		<AudioPlayerProvider>
			<Header />
			{props.children}
			<Footer/>
		</AudioPlayerProvider>
	</div>;
}
